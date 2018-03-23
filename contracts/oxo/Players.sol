pragma solidity 0.4.19;

import "./GameEntity.sol";

contract Players is GameEntity {

    function addPlayer(uint gameId, address player) internal {
        games[gameId].players.push(player);
        games[gameId].playerCount += 1;
    }

    function addCanceler(uint gameId, address player) internal {
        games[gameId].cancelers.push(player);
        games[gameId].cancelerCount += 1;
    }

    function isPlayer(uint gameId, address player) internal view returns(bool){
        return games[gameId].players[0] == player || games[gameId].players[1] == player;
    }

    function isCanceler(uint gameId, address player) internal view returns(bool){
        return games[gameId].cancelers[0] == player || games[gameId].cancelers[1] == player;
    }

    function player(uint gameId, uint8 index) internal view returns(address){
        return games[gameId].players[index];
    }
}
