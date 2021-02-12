const k8s = require("@kubernetes/client-node");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { expect } = require("chai");

const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const watch = new k8s.Watch(kc);


const k8sDynamicApi = kc.makeApiClient(k8s.KubernetesObjectApi);

const helloYaml = fs.readFileSync(
  path.join(__dirname, "../../hello-k3s.yaml"),
  {
    encoding: "utf8",
  }
);

const helloResources = k8s.loadAllYaml(helloYaml);

async function kApply(resources) {
  const options = { "headers": { "Content-type": 'application/merge-patch+json' } };
  for (resource of resources) {
    await k8sDynamicApi.read(resource)
      .then(async (existing) => {
        resource.metadata.resourceVersion = existing.body.metadata.resourceVersion;
        await k8sDynamicApi.patch(resource, undefined, undefined, undefined, undefined, options);
        console.log(resource.kind,resource.metadata.name, "reconfigured")
      })
      .catch(async (e) => {
        if (e.body && e.body.reason == 'NotFound') {
          await k8sDynamicApi.create(resource);
          console.log(resource.kind,resource.metadata.name, "created")
        } else {
          throw e
        }
      });
  }

}

function waitForK8sObject(path, query, checkFn, timeout, timeoutMsg) {
  let res
  let timer
  const result = new Promise((resolve, reject) => {
    watch.watch(path, query, (type, apiObj, watchObj) => {
      if (checkFn(type, apiObj, watchObj)) {
        if (res) {
          res.abort();
        }
        clearTimeout(timer)
        resolve(watchObj.object)
      }
    }, () => { }).then((r) => { res = r; timer = setTimeout(() => { res.abort(); reject(new Error(timeoutMsg)) }, timeout); })
  });
  return result;
}

function waitForDeployment(name, namespace = "default", timeout = 90000) {
  return waitForK8sObject(`/apis/apps/v1/namespaces/${namespace}/deployments`, {}, (_type, _apiObj, watchObj) => {
    return (watchObj.object.metadata.name == name && watchObj.object.status.conditions
      && watchObj.object.status.conditions.some((c) => (c.type == 'Available' && c.status == 'True')))
  }, timeout, `Waiting for deployment ${name} timeout (${timeout} ms)`);

}
function waitForService(name, namespace = "default", timeout = 90000) {
  return waitForK8sObject(`/api/v1/namespaces/${namespace}/services`, {}, (_type, _apiObj, watchObj) => {
    return (watchObj.object.metadata.name == name && watchObj.object.status.loadBalancer && 
      watchObj.object.status.loadBalancer.ingress && watchObj.object.status.loadBalancer.ingress.find(({ip})=>ip))
  }, timeout, `Waiting for service ${name} timeout (${timeout} ms)`);
}


describe("Test on kubernetes", function () {
  this.timeout(60 * 1000);
  this.slow(5 *1000);

  it("Hello world should be deployed", async function () {
    await kApply(helloResources);
    await waitForDeployment("hello-k3s","default",30000);
  });

  it("Service should get external IP", async function () {
    await waitForService("hello-k3s","default",30000);
  });

  it("Service should return message", async function () {
    const response = await axios.get(`http://localhost/api`)
    expect(response.data.message).equals("Hello dkom!");
  });

  it.skip("Clean up", async function(){
    for (resource of helloResources) {
      await k8sDynamicApi.delete(resource);
    }
  })

})