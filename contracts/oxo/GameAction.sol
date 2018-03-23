pragma solidity 0.4.19;

import "./GameEntity.sol";

contract GameAction is GameEntity {


    function addMove(uint gameId, uint8 move, address addr) internal {
        games[gameId].moves[addr][move] = true;
        games[gameId].moveCount[addr] += 1;
        games[gameId].allMoves[move] = true;
        games[gameId].allMoveCount += 1;

        games[gameId].lastMove = msg.sender;
    }

    function isMoved(uint gameId, uint8 move) internal view returns (bool){
        return games[gameId].allMoves[move];
    }

    function isMoved(uint gameId, address addr, uint8 move) internal view returns (bool){
        return games[gameId].moves[addr][move];
    }
}
