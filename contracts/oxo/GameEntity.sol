pragma solidity 0.4.19;

contract GameEntity {
    enum GameStatus {CREATED, STARTED, FINISHED}
    struct Game {
        GameStatus status;
        uint bet;

        mapping(address => mapping(uint8 => bool)) moves;
        mapping(address => uint8) moveCount;
        mapping(uint8 => bool) allMoves;
        uint8 allMoveCount;

        uint8 playerCount;
        address[] players;
        uint8 cancelerCount;
        address[] cancelers;

        address winner;
        address lastMove;// helps define whom should move next
    }

    Game[] internal games;
}
