const colors ={
    WHITE: 'white',
    BLACK: 'black'
};

const gameState = {
    currentPlayer: colors.WHITE,
    gameOver: false,
    validMoves: null,
    moveHistory:[],
    board:null,
    castleRights:{
        whiteKingSide:false,
        blackKingSide:false
    }
};

const pieceTypes = {
    Empty: '',
    King: 'king',
    Queen: 'queen',
    ROOK: 'rook',
    BISHOP: 'bishop',
    KNIGHT: 'knight',
    PAWN: 'pawn'
};


const MOVE_PATTERNS = {
    // Pawn moves: [row, col] offsets
    // White pawns move up (negative row), black pawns move down (positive row)
    PAWN: {
        white: {
            normal: [[-1, 0]],            // Move forward 1
            initial: [[-2, 0]],  // First move: 1 or 2 squares
            captures: [[-1, -1], [-1, 1]], // Diagonal captures
        },
        black: {
            normal: [[1, 0]],
            initial: [[2, 0]],
            captures: [[1, -1], [1, 1]]
        }
    },
    
    // Knight moves: L-shaped
    KNIGHT: [
        [2, 1], [2, -1], [-2, 1], [-2, -1],
        [1, 2], [1, -2], [-1, 2], [-1, -2]
    ],
    
    // Bishop moves: Diagonals
    BISHOP: [
        [1, 1], [1, -1], [-1, 1], [-1, -1]
    ],
    
    // Rook moves: Horizontals/Verticals
    ROOK: [
       [1, 0], [-1, 0], [0, 1], [0, -1]
    ],
    
    // Queen moves: All 8 directions
    QUEEN: [
        [1, 0], [-1, 0], [0, 1], [0, -1],
        [1, 1], [1, -1], [-1, 1], [-1, -1]
    ],
    
    // King moves: One square in any direction
    KING:
     [
        [1, 0], [-1, 0], [0, 1], [0, -1],
        [1, 1], [1, -1], [-1, 1], [-1, -1]
     ]
};

const PIECE_MAPPING = {
    'p': 'PAWN',
    'n': 'KNIGHT',
    'b': 'BISHOP',
    'r': 'ROOK',
    'q': 'QUEEN',
    'k': 'KING'
};

const START_POSITION = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

// Unicode chess pieces
const pieceSymbol = {
    'K': '♔',  // White King
    'Q': '♕',  // White Queen
    'R': '♖',  // White Rook
    'B': '♗',  // White Bishop
    'N': '♘',  // White Knight
    'P': '♙',  // White Pawn
    'k': '♚',  // Black King
    'q': '♛',  // Black Queen
    'r': '♜',  // Black Rook
    'b': '♝',  // Black Bishop
    'n': '♞',  // Black Knight
    'p': '♟'   // Black Pawn
};

function drawBoard(){
    for(let row = 0; row<8; ++row){
        for(let col = 0; col<8; ++col){
            const piece = gameState.board[row][col];
            const squareId = String.fromCharCode(97 + col) + "_" + (8-row);
            $("#" + squareId).text(pieceSymbol[piece]);
        }
    }
}

function initializeGame(){
    gameState.board = START_POSITION;
    gameState.currentPlayer = colors.WHITE;
    gameState.gameOver = false;
    gameState.selectedSquare = null;
    gameState.validMoves = [];
    gameState.moveHistory = [];
}
function inBoard(row, col){
    if(row<0 || row>7 || col <0 || col>7){
        return false;
    }
    return true;
}
function getPieceAt(row,col){
    if(!inBoard(row,col)){
        return '';
    }
    return gameState.board[row][col];
}

function isOpponentPiece(piece){
    if(piece === pieceTypes.Empty){
        return false;
    }
    const isWhite = piece === piece.toUpperCase();
    if((isWhite && gameState.currentPlayer === colors.BLACK) ||
       (!isWhite && gameState.currentPlayer === colors.WHITE)){
        return true;
    }
    return false;
}

function isEmptySquare(piece){
    return piece === pieceTypes.Empty;
}
function findMovingPiece(pieceChar){
    return gameState.moveHistory.find(move =>move.piece === pieceChar);
}

//handle Promotion
function handlePromotion(pieceChar) {
    const isWhite = pieceChar.toLowerCase() === pieceChar;
    
    const promotionPieces = {
        [COLOR.WHITE]: {
            'queen': 'Q',
            'rook': 'R',
            'bishop': 'B',
            'knight': 'N'
        },
        [COLOR.BLACK]: {
            'queen': 'q',
            'rook': 'r',
            'bishop': 'b',
            'knight': 'n'
        }
    };
    
    // Get the promoted piece character
    const promotedPiece = promotionPieces[isWhite ? COLOR.WHITE : COLOR.BLACK][promotionPiece];
    
    if (promotedPiece) {
        // Update the board with promoted piece
        gameState.board[to.row][to.col] = promotedPiece;
        return true;
    }
    
    return false;
}

// Alternative: Auto-queen (most common in practice)
function autoPromoteToQueen([row,col]) {
    let piece = getPieceAt(row,col);
    let isWhite = piece.toLowerCase() === piece;
    gameState.board[row][col] = isWhite ? 'Q' : 'q';
}


//Caculate sliding moves
function calculateSlidingMoves(row,col){
    const patterns = MOVE_PATTERNS.ROOK;
    patterns.forEach(([dr, dc]) => {
        for(let step=1;step<8;++step){
            let newRow = row + dr*step;
            let newCol = col + dc*step;
            if(!inBoard(newRow, newCol)){
                break;
            }
            if(!isEmptySquare(getPieceAt(newRow,newCol)) && !isOpponentPiece(getPieceAt(newRow,newCol))){
                break;
            }
            gameState.validMoves.push({type:'normal',row: newRow, col: newCol});
            if(!isEmptySquare(getPieceAt(newRow,newCol))){
                break;
            }
        }
    });
}

//Caculate diagonal moves
function calculateDiagonalMoves(row,col){
    const patterns = MOVE_PATTERNS.BISHOP;
    patterns.forEach(([dr, dc]) => {
        for(let step=1;step<8;++step){
            let newRow = row + dr*step;
            let newCol = col + dc*step;
            if(!inBoard(newRow, newCol)){
                break;
            }
            if(!isEmptySquare(getPieceAt(newRow,newCol)) && !isOpponentPiece(getPieceAt(newRow,newCol))){
                break;
            }
            gameState.validMoves.push({type:'normal',row: newRow, col: newCol});
            if(!isEmptySquare(getPieceAt(newRow,newCol))){
                break;
            }
        }
    });
}
function determineCastleRights(){
    // To be implemented: Update castle rights based on moves
    if(!findMovingPiece('r') && !findMovingPiece('k')
    && getPieceAt(0,6) === getPieceAt(0,5) && getPieceAt(0,5) === pieceTypes.Empty){
        gameState.castleRights.blackKingSide= true;
    }
    else{
        gameState.castleRights.blackKingSide= false;
    }
    if(!findMovingPiece('R') && !findMovingPiece('K')
    && getPieceAt(7,6) === getPieceAt(7,5) && getPieceAt(7,5) === pieceTypes.Empty){
        gameState.castleRights.whiteKingSide= true;
    }
    else{
        gameState.castleRights.whiteKingSide= false;
    }
}

//Calculate pawn moves
function calculatePawnMoves(row,col,isWhite){
    const patterns = isWhite?MOVE_PATTERNS.PAWN.white:MOVE_PATTERNS.PAWN.black;
    //Normal values (1 square forward)
    patterns.normal.forEach(([dr, dc]) => {
        let newRow = row + dr;
        let newCol = col + dc;
        let piece = getPieceAt(newRow,newCol);
        if (inBoard(newRow, newCol) && isEmptySquare(piece)) {
           gameState.validMoves.push({type:'normal',row: newRow, col: newCol});
        }
    });

    // INITIAL MOVE
    patterns.initial.forEach(([dr, dc]) => {
        let newRow = row + dr;
        let newCol = col + dc;
        let piece = getPieceAt(newRow,newCol);
        if (inBoard(newRow, newCol) && isEmptySquare(getPieceAt(row + dr/2,col))  && isEmptySquare(piece) && (isWhite?row===6:row===1)) {
           gameState.validMoves.push({type:'normal',row: newRow, col: newCol});
        }
    });

    //CAPTURES
    patterns.captures.forEach(([dr, dc]) => {
        let newRow = row + dr;
        let newCol = col + dc;
        let piece = getPieceAt(newRow,newCol);
        if (inBoard(newRow, newCol) && isOpponentPiece(piece)) {
           gameState.validMoves.push({type:'normal',row: newRow, col: newCol});
        }
    });
}

//Calculate king moves
function calculateKingMoves(row,col){
    const patterns = MOVE_PATTERNS.KING;
    patterns.forEach(([dr, dc]) => {
        let newRow = row + dr;
        let newCol = col + dc;
        let piece = getPieceAt(newRow,newCol);
        if (inBoard(newRow, newCol) && (isEmptySquare(piece) || isOpponentPiece(piece))) {
            gameState.validMoves.push({type:'normal',row: newRow, col: newCol});     
        }
    });
    // Castling moves will be handled separately
    if(gameState.currentPlayer === colors.WHITE && gameState.castleRights.whiteKingSide){
        gameState.validMoves.push({type:'castle',row:row, col:col+2});
    }

    if(gameState.currentPlayer === colors.BLACK && gameState.castleRights.blackKingSide){
        gameState.validMoves.push({type:'castle',row:row, col:col+2});
    }
}

//Calculate knight moves
function calculateKnightMoves(row,col){
    const patterns = MOVE_PATTERNS.KNIGHT;
    patterns.forEach(([dr, dc]) => {
        let newRow = row + dr;
        let newCol = col + dc;
        let piece = getPieceAt(newRow,newCol);
        if (inBoard(newRow, newCol) && (isEmptySquare(piece) || isOpponentPiece(piece))) {
            gameState.validMoves.push({type:'normal',row: newRow, col: newCol});
        }
    });
}

//Caculate queen moves
function calculateQueenMoves(row,col){
    calculateSlidingMoves(row,col);
    calculateDiagonalMoves(row,col);
}

function clearValidMoves(){
    for (let move of gameState.validMoves){
        let squareId = convertCoordsToSquareId(move.row,move.col);
        // alert(squareId);
        $("#" + squareId).removeClass("highlight");
        $("#" + squareId).off("click");
    }
    gameState.validMoves.length = 0; 
}
function caculateValidMoves(row,col,piece){
    if(gameState.validMoves.length>0){
        clearValidMoves();
    }
    determineCastleRights();
    const pieceChar = piece.toLowerCase();
    const pieceType =  PIECE_MAPPING[pieceChar];
    const isWhite = piece === piece.toUpperCase();
    if((isWhite && gameState.currentPlayer === colors.BLACK)){
        alert("Not your turn");
        return;
    }
    if(!isWhite && gameState.currentPlayer === colors.WHITE){
        alert("Not your turn");
        return;
    }
    switch(pieceType) {
        case 'PAWN':
            calculatePawnMoves(row, col, isWhite);
            break;
        case 'KING':
            calculateKingMoves(row, col);
            break;
        case 'KNIGHT':
            calculateKnightMoves(row, col);
            break;
        case 'ROOK':
            calculateSlidingMoves(row, col);
            break;
        case 'BISHOP':
            calculateDiagonalMoves(row, col);
            break;
        case 'QUEEN':
            calculateQueenMoves(row, col);
            break;
        // Other piece types can be added here}
    }
}

function convertSquareIdToCoords(event){
    const id = event.target.id;
    if(id.length>4) return;
    console.log(id);
    const parts = id.split("_");
    const col = parts[0].charCodeAt(0) - 97;
    const row = 8-parts[1]; 
    return (row,col);
}

function convertCoordsToSquareId(row,col){
    return String.fromCharCode(97 + col) + "_" + (8-row);
}

function selectedSquare([row,col],move){
    let new_row  = move.row;
    let new_col = move.col;
    let element = convertCoordsToSquareId(row,col);
    let new_element = convertCoordsToSquareId(new_row,new_col);
    let piece = getPieceAt(row,col);
    let next_piece = getPieceAt(new_row,new_col);
    $("#" + element).text('');
    $("#" + new_element).text(pieceSymbol[piece]);
    gameState.moveHistory.push({
        piece:piece,
        position:[new_row,new_col]
    });
    if(move.type === 'castle'){
        if(piece.toLowerCase() ==='r'){
            return;
        }
        if(gameState.currentPlayer === colors.WHITE){
            selectedSquare([7,7],{type:'castle',row:7,col:5});      
        }    
        if(gameState.currentPlayer === colors.BLACK){
            selectedSquare([0,7],{type:'castle',row:0,col:5});
        }
    }

    if(piece.toLowerCase() === 'p'){
        if(gameState.currentPlayer === colors.WHITE && row === 0){
            autoPromoteToQueen([new_row,new_col]);
        }
        if(gameState.currentPlayer === colors.BLACK && row === 7){
            autoPromoteToQueen([new_row,new_col]);
        }
    }

    if(gameState.currentPlayer === colors.WHITE){
            gameState.currentPlayer = colors.BLACK;
    }
    else{
            gameState.currentPlayer = colors.WHITE;
    }
    clearValidMoves();
    gameState.board[new_row][new_col] = piece;
    gameState.board[row][col] = pieceTypes.Empty;
    if(next_piece.toLowerCase()==='k'){
        setTimeout(()=>{
            alert("Game over");   
        },500);
        resetGame();
    }   
}

$(document).ready(
    function() {
    initializeGame();
    drawBoard();
    $('.chessboard').click(function(event){
        const id = event.target.id;
        if(id.length>4) return;
        const parts = id.split("_");
        const col = parts[0].charCodeAt(0) - 97;
        const row = 8-parts[1]; 
        if(getPieceAt(row,col) === pieceTypes.Empty){
            return;
        }
        caculateValidMoves(row,col,getPieceAt(row,col));
        for (let move of gameState.validMoves){
            let new_row = move.row;
            let new_col = move.col;
            let squareId = convertCoordsToSquareId(new_row,new_col);
            // alert(squareId);
            $("#" + squareId).addClass("highlight");
            $("#" + squareId).on("click",(event)=>{
                event.stopPropagation();
                selectedSquare([row,col],move);
            });
        }
    });
} );
