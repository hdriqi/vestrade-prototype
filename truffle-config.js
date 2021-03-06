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
      host: "52.77.210.249",
      port: 8545,
      from: '0x70e773440ce6D52e4215a93A7B6F897D5605302c',
      network_id: "*"
    }
	}
};
