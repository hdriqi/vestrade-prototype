pragma solidity ^0.5.0;

import "./common/Ownable.sol";
import "./Vestrade_Offering.sol";

contract Vestrade_Offering_Factory is Ownable {
	event OfferingEvent(string name, address addr, address tokenAddr, uint256 supply, uint256 rate, uint64 startDate, uint64 endDate);

	function create(
		string memory _name,
		address _tokenAddr,
		uint256 _supply,
		uint256 _rate,
		uint64 _startDate,
		uint64 _endDate
	) public onlyOwner {
		Vestrade_Offering newOffering = new Vestrade_Offering(_name, _tokenAddr, _supply, _rate, _startDate, _endDate);

		newOffering.transferOwnership(msg.sender);

		emit OfferingEvent(_name, address(newOffering), address(_tokenAddr), _supply, _rate, _startDate, _endDate);
	}
}
