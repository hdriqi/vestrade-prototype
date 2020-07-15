const path = require("path");

module.exports = {
	// See <http://truffleframework.com/docs/advanced/configuration>
	// to customize your Truffle configuration!
	contracts_build_directory: path.join(__dirname, "client/src/contracts"),
	compilers: {
		solc: {
			version: "0.5.0"
		}
	},
	networks: {
		development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*"
    },
    test: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*"
    },
		prototype: {
      host: "3.1.72.190",
      port: 8545,
      from: '0x0a2FA11b091c69797ce20f34cfE306A9b0Fd3f15',
      network_id: "*"
    }
	}
};
