pragma solidity ^0.5.0;

import "./common/Ownable.sol";
import "./Vestrade_ERC20.sol";

contract Vestrade_Offering is Ownable {
  using SafeMath for uint256;
  string public name;
  address public tokenAddr;
  bool public init;
  uint256 public rate;
  uint256 public supply;
  uint256 public balance;
  uint64 public startDate;
  uint64 public endDate;

  event Buy(address addr, address token, uint256 amount);

  constructor(string memory _name, address _tokenAddr, uint256 _supply, uint256 _rate, uint64 _startDate, uint64 _endDate) public payable {
    name = _name;
    tokenAddr = _tokenAddr; // token address that being offered
    rate = _rate; // in wei
    supply = _supply; // max supply
    balance = _supply; // current balance
    startDate = _startDate; // offering start date
    endDate = _endDate; // offering last date
  }

  function offeringStatus() public view returns (bool) {
    return init;
  }

  function mintStatus() public view returns (bool) {
    return Vestrade_ERC20(tokenAddr).balanceOf(address(this)) >= supply;
  }

  function startOffering() public onlyOwner {
    require(
      Vestrade_ERC20(tokenAddr).balanceOf(address(this)) >= supply,
      "Contract does not have enough balance"
    );
    init = true;
  }

  function withdraw() public onlyOwner  {
    Vestrade_ERC20(tokenAddr).transfer(owner(), balance);
  }

  function buy(uint256 amount) public payable {
    require(init, "Offering is not initialized");
    require(
      amount == msg.value * rate,
      "Amount is not equal to buyer's value x rate"
    );
    require(
      balance >= amount,
      "Purchased token is more than the available token"
    );
    address payable ownerWallet = address(uint160(owner()));
    ownerWallet.transfer(msg.value);
    require(
      Vestrade_ERC20(tokenAddr).transfer(msg.sender, amount),
      "Failed transfer from contract to buyer"
    );
    balance -= amount;

    emit Buy(address(msg.sender), address(tokenAddr), amount);
  }
}