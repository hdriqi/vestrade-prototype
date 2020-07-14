pragma solidity ^0.5.0;

import "./common/Ownable.sol";
import "./Vestrade_ERC20.sol";

contract Vestrade_ERC20_Factory is Ownable {
	event TokenCreated(string name, address addr);
	mapping(string => address) tokens;

	function create(string memory name, string memory symbol, uint8 decimals) public onlyOwner {
		require(tokens[name] == address(0), "Tokens already exist");
		Vestrade_ERC20 newToken = new Vestrade_ERC20(name, symbol, decimals);

		newToken.addMinter(msg.sender);
		tokens[name] = address(newToken);

		emit TokenCreated(name, address(newToken));
	}
}