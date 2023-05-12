const HKDCToken = artifacts.require("HKDCToken");

module.exports = function (deployer) {
  deployer.deploy(HKDCToken, 1000000000000, 6);
};
