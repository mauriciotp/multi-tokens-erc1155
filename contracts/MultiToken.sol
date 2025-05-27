// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {ERC1155Burnable} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract MultiToken is ERC1155, ERC1155Burnable {
    uint public constant NFT_0 = 0;
    uint public constant NFT_1 = 1;
    uint public constant NFT_2 = 2;

    uint public tokenPrice = 0.01 ether;

    uint[] public currentSupply = [50, 50, 50];

    string public constant BASE_URL =
        "ipfs://bafybeif3moyh3indmueoidvodhrwwsdlipdmsnoedgykxg22nciqzxowei/";

    address payable public immutable owner;

    constructor() ERC1155(BASE_URL) {
        owner = payable(msg.sender);
    }

    function mint(uint256 id) external payable {
        require(id < 3, "This token does not exist");
        require(msg.value >= 0.01 ether, "Insufficient payment");
        require(currentSupply[id] > 0, "Max supply reached");

        _mint(msg.sender, id, 1, "");
        currentSupply[id]--;
    }

    function uri(uint256 id) public pure override returns (string memory) {
        require(id < 3, "This token does not exist");
        return string.concat(BASE_URL, Strings.toString(id), ".json");
    }

    function withdraw() external {
        require(msg.sender == owner, "You do not have permission");

        uint256 amount = address(this).balance;
        (bool success, ) = owner.call{value: amount}("");
        require(success == true, "Failed to withdraw");
    }
}
