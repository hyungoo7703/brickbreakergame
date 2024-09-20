const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let x = canvas.width / 2;
let y = canvas.height - 30;
let dx = 3;
let dy = -5;
const ballRadius = 10;

const paddleHeight = 10;
let paddleWidth = 75;
let paddleX = (canvas.width - paddleWidth) / 2;

const brickRowCount = 3;
const brickColumnCount = 5;
const brickWidth = 75;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 30;

let score = 0;
let lives = 3;
let level = 1;

const brickTypes = ['normal', 'strong', 'unbreakable'];
const powerUps = ['extraLife', 'widePaddle', 'multiball'];

let balls = [{x: x, y: y, dx: dx, dy: dy}];
let activePowerUps = [];

let isBossStage = false;
let boss = {
    x: canvas.width / 2,
    y: 50,
    width: 100,
    height: 50,
    health: 100,
    dx: 2
};

const bricks = [];
for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
        bricks[c][r] = { 
            x: 0, 
            y: 0, 
            status: 1, 
            type: brickTypes[Math.floor(Math.random() * brickTypes.length)]
        };
    }
}

function drawBall(ball) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();
}

function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status > 0) {
                const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
                const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;
                ctx.beginPath();
                ctx.rect(brickX, brickY, brickWidth, brickHeight);
                switch(bricks[c][r].type) {
                    case 'normal': ctx.fillStyle = "#0095DD"; break;
                    case 'strong': ctx.fillStyle = "#FF0000"; break;
                    case 'unbreakable': ctx.fillStyle = "#000000"; break;
                }
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

function drawScore() {
    ctx.font = "16px Arial";
    ctx.fillStyle = "#0095DD";
    ctx.fillText("Score: "+score, 8, 20);
}

function drawLives() {
    ctx.font = "16px Arial";
    ctx.fillStyle = "#0095DD";
    ctx.fillText("Lives: "+lives, canvas.width-65, 20);
}

function drawLevel() {
    ctx.font = "16px Arial";
    ctx.fillStyle = "#0095DD";
    ctx.fillText("Level: "+level, canvas.width/2-25, 20);
}

function drawPowerUps() {
    activePowerUps.forEach(powerUp => {
        ctx.beginPath();
        ctx.rect(powerUp.x, powerUp.y, 20, 20);
        ctx.fillStyle = "#00FF00";
        ctx.fill();
        ctx.closePath();
    });
}

function drawBoss() {
    ctx.beginPath();
    ctx.rect(boss.x, boss.y, boss.width, boss.height);
    ctx.fillStyle = "#FF0000";
    ctx.fill();
    ctx.closePath();

    // 보스 체력바
    ctx.beginPath();
    ctx.rect(boss.x, boss.y - 10, boss.width * (boss.health / 100), 5);
    ctx.fillStyle = "#00FF00";
    ctx.fill();
    ctx.closePath();
}

function checkLevelComplete() {
    let breakableBricks = 0;
    let brokenBricks = 0;
    
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].type !== 'unbreakable') {
                breakableBricks++;
                if (bricks[c][r].status === 0) {
                    brokenBricks++;
                }
            }
        }
    }
    
    if (breakableBricks === brokenBricks) {
        levelUp();
    }
}

function collisionDetection() {
    if (isBossStage) {
        balls.forEach(ball => {
            if (ball.x > boss.x && ball.x < boss.x + boss.width && 
                ball.y > boss.y && ball.y < boss.y + boss.height) {
                ball.dy = -ball.dy;
                boss.health -= 10;
                if (boss.health <= 0) {
                    levelUp();
                }
            }
        });
    } else {
        for (let c = 0; c < brickColumnCount; c++) {
            for (let r = 0; r < brickRowCount; r++) {
                const b = bricks[c][r];
                if (b.status > 0) {
                    balls.forEach(ball => {
                        if (ball.x > b.x && ball.x < b.x + brickWidth && ball.y > b.y && ball.y < b.y + brickHeight) {
                            ball.dy = -ball.dy;
                            if (b.type !== 'unbreakable') {
                                if (b.type === 'strong') {
                                    b.status--;
                                } else {
                                    b.status = 0;
                                }
                                score++;
                                spawnPowerUp(b.x, b.y);
                                if (score == brickRowCount * brickColumnCount) {
                                    levelUp();
                                }
                            }
                        }
                    });
                }
            }
        }
    }
    checkLevelComplete();
}

function levelUp() {
    level++;
    dx *= 1.2;
    dy *= 1.2;
    paddleWidth *= 0.9;
    if (level % 5 === 0) {
        startBossStage();
    } else {
        resetBricks();
    }
}

function resetBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            bricks[c][r].status = 1;
            bricks[c][r].type = brickTypes[Math.floor(Math.random() * brickTypes.length)];
        }
    }
}

function spawnPowerUp(x, y) {
    if (Math.random() < 0.1) {
        const type = powerUps[Math.floor(Math.random() * powerUps.length)];
        activePowerUps.push({x: x, y: y, type: type});
    }
}

function updatePowerUps() {
    for (let i = activePowerUps.length - 1; i >= 0; i--) {
        let powerUp = activePowerUps[i];
        powerUp.y += 2;
        if (powerUp.y > canvas.height) {
            activePowerUps.splice(i, 1);
        } else if (powerUp.y + 20 > canvas.height - paddleHeight && 
                   powerUp.x > paddleX && powerUp.x < paddleX + paddleWidth) {
            activatePowerUp(powerUp.type);
            activePowerUps.splice(i, 1);
        }
    }
}

function activatePowerUp(type) {
    switch(type) {
        case 'extraLife':
            lives++;
            break;
        case 'widePaddle':
            paddleWidth *= 1.5;
            setTimeout(() => paddleWidth /= 1.5, 10000);
            break;
        case 'multiball':
            balls.push({x: x, y: y, dx: -dx, dy: dy});
            balls.push({x: x, y: y, dx: dx, dy: -dy});
            break;
    }
}

function moveBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status > 0) {
                bricks[c][r].x += Math.sin(Date.now() / 1000) * 2;
            }
        }
    }
}

function applyScreenEffect() {
    ctx.save();
    ctx.fillStyle = `rgba(255, 0, 0, ${Math.sin(Date.now() / 1000) * 0.1 + 0.1})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
}

function applyGravity() {
    balls.forEach(ball => {
        ball.dy += 0.01;
    });
}

function startBossStage() {
    isBossStage = true;
    boss.health = 100;
    boss.x = canvas.width / 2 - boss.width / 2;
}

function updateBoss() {
    boss.x += boss.dx;
    if (boss.x + boss.width > canvas.width || boss.x < 0) {
        boss.dx = -boss.dx;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (isBossStage) {
        drawBoss();
        updateBoss();
    } else {
        drawBricks();
        moveBricks();
    }
    
    balls.forEach(drawBall);
    drawPaddle();
    drawScore();
    drawLives();
    drawLevel();
    drawPowerUps();
    
    collisionDetection();
    updatePowerUps();
    applyScreenEffect();
    applyGravity();

    // draw 함수 내 공 움직임 부분 수정
    balls.forEach(ball => {
        if (ball.x + ball.dx > canvas.width - ballRadius || ball.x + ball.dx < ballRadius) {
            ball.dx = -ball.dx;
        }
        if (ball.y + ball.dy < ballRadius) {
            ball.dy = -ball.dy;
        } else if (ball.y + ball.dy > canvas.height - ballRadius) {
            if (ball.x > paddleX - ballRadius && ball.x < paddleX + paddleWidth + ballRadius) {
                // 패들에 부딪힐 때 속도 재설정
                let hitPoint = (ball.x - (paddleX + paddleWidth/2)) / (paddleWidth/2);
                ball.dx = hitPoint * 5;
                ball.dy = -Math.max(5, Math.abs(ball.dy)); // 최소 상승 속도 보장
            } else {
                // 공을 놓쳤을 때 처리
                balls = balls.filter(b => b !== ball);
                if (balls.length === 0) {
                    lives--;
                    if (!lives) {
                        alert("GAME OVER");
                        document.location.reload();
                    } else {
                        ball.x = canvas.width / 2;
                        ball.y = canvas.height - 30;
                        ball.dx = dx;
                        ball.dy = -5; // 초기 상승 속도로 재설정
                        paddleX = (canvas.width - paddleWidth) / 2;
                        balls.push(ball);
                    }
                }
            }
        }

        ball.x += ball.dx;
        ball.y += ball.dy;
    });

    if (rightPressed && paddleX < canvas.width - paddleWidth) {
        paddleX += 7;
    } else if (leftPressed && paddleX > 0) {
        paddleX -= 7;
    }

    requestAnimationFrame(draw);
}

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
document.addEventListener("mousemove", mouseMoveHandler, false);

let rightPressed = false;
let leftPressed = false;

function keyDownHandler(e) {
    if (e.key == "Right" || e.key == "ArrowRight") {
        rightPressed = true;
    } else if (e.key == "Left" || e.key == "ArrowLeft") {
        leftPressed = true;
    }
}

function keyUpHandler(e) {
    if (e.key == "Right" || e.key == "ArrowRight") {
        rightPressed = false;
    } else if (e.key == "Left" || e.key == "ArrowLeft") {
        leftPressed = false;
    }
}

function mouseMoveHandler(e) {
    const relativeX = e.clientX - canvas.offsetLeft;
    if (relativeX > 0 && relativeX < canvas.width) {
        paddleX = relativeX - paddleWidth / 2;
    }
}

draw();
