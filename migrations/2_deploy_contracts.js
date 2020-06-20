var Vestrade_ERC20_Factory = artifacts.require("./Vestrade_ERC20_Factory.sol");
var Vestrade_Offering_Factory = artifacts.require("./Vestrade_Offering_Factory.sol");

module.exports = function(deployer) {
  deployer.deploy(Vestrade_ERC20_Factory);
  deployer.deploy(Vestrade_Offering_Factory);
};
