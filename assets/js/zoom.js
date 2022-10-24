//  初始化資訊
window.addEventListener("load", init);
const svgElement = document.getElementById("svg");
//  Create Manager
const mc = new Hammer.Manager(svgElement);
function init() {
    // Create Recognizer
    const pinch = new Hammer.Pinch();
    const pan = new Hammer.Pan();

    pinch.requireFailure(pan);

    //  把 recognizer 加到 manager
    mc.add([pinch, pan]);

    mc.on("pinchstart", () => {
        console.log("pinchstart");
    });
    mc.on("pinchmove", zoom);
    mc.on("pinchend", pinchend);
    mc.on("panstart", panstart);
    mc.on("panmove", panmove);
    mc.on("panend", panend);

    //  回報滑鼠座標事件
    // svgElement.addEventListener('mousemove', reportCurrentPoint, false)
    //  拖曳的事件
    // svgElement.addEventListener('mousedown', mouseDown, false)
    // svgElement.addEventListener('mousemove', drag, false)
    // svgElement.addEventListener('mouseup', mouseUp, false)
    //  縮放的事件
    svgElement.addEventListener("wheel", zoom, false);
}

/*
開始：滑鼠拖拉的效果
*/
let paning;
let startViewBox = null;

function panstart() {
    paning = true;
    console.log("panstart");
    //  1. 取得一開始的 viewBox 值，原本是字串，拆成陣列，方便之後運算
    startViewBox = svgElement
        .getAttribute("viewBox")
        .split(" ")
        .map(n => parseFloat(n));
}
//  拖拉的移動過程
function panmove(e) {
    if (paning) {
        //  2. 取得 pointer 當前 viewport 中 client 座標值
        let startClient = {
            x: e.changedPointers[0].clientX,
            y: e.changedPointers[0].clientY
        };

        //  3. 計算對應回去的 SVG 座標值
        let newSVGPoint = svgElement.createSVGPoint();
        let CTM = svgElement.getScreenCTM();
        newSVGPoint.x = startClient.x;
        newSVGPoint.y = startClient.y;
        let startSVGPoint = newSVGPoint.matrixTransform(CTM.inverse());

        //  4. 計算拖曳後滑鼠所在的 viewport client 座標值
        let moveToClient = {
            x: e.changedPointers[0].clientX + e.deltaX,
            y: e.changedPointers[0].clientY + e.deltaY
        };

        //  5. 計算對應回去的 SVG 座標值
        newSVGPoint = svgElement.createSVGPoint();
        CTM = svgElement.getScreenCTM();
        newSVGPoint.x = moveToClient.x;
        newSVGPoint.y = moveToClient.y;
        let moveToSVGPoint = newSVGPoint.matrixTransform(CTM.inverse());

        // 6. 計算位移量
        let delta = {
            dx: startSVGPoint.x - moveToSVGPoint.x,
            dy: startSVGPoint.y - moveToSVGPoint.y
        };
        //  7. 設定新的 viewBox 值
        let moveToViewBox = `${startViewBox[0] + delta.dx} ${startViewBox[1] + delta.dy} ${startViewBox[2]} ${startViewBox[3]}`;
        svgElement.setAttribute("viewBox", moveToViewBox);
    }
}

//  滑鼠點擊結束（拖曳結束）
function panend() {
    console.log("panend");
    paning = false;
}
//  結束：滑鼠拖拉的效果

/*
開始：滑鼠縮放的效果
*/
let adjustScale = 1;
let currentScale = null;
let ratio = 1;

function zoom(e) {
    //  1.取得一開始的 viewBox。
    let startViewBox = svgElement
        .getAttribute("viewBox")
        .split(" ")
        .map(n => parseFloat(n));

    //  2.取得滑鼠執行縮放位置的 viewPort Client 座標，並利用 CTM 對應取得 SVG 座標。

    //  2.1 取得滑鼠執行縮放的位置
    let startClient;
    if (e.type === "wheel") {
        startClient = {
            x: e.clientX,
            y: e.clientY
        };
    }
    if (e.type === "pinchmove") {
        startClient = {
            x: e.center.x,
            y: e.center.y
        };
    }

    //  2.2 轉換成 SVG 座標系統中的 SVG 座標點
    let newSVGPoint = svgElement.createSVGPoint();
    let CTM = svgElement.getScreenCTM();
    newSVGPoint.x = startClient.x;
    newSVGPoint.y = startClient.y;
    let startSVGPoint = newSVGPoint.matrixTransform(CTM.inverse());

    //  3.進行縮放，如果要讓原本的尺寸縮放兩倍的話。
    //  3.1 設定縮放倍率
    let zoomSize = {
        max: 2,
        min: 0.5
    };

    let viewport = {
        width: svgElement.getBoundingClientRect().width,
        height: svgElement.getBoundingClientRect().height
    };

    if (e.type === "wheel") {
        let tmp = ratio + e.deltaY / 100;
        console.log('tmp', tmp)
        if (tmp >= zoomSize.max) {
            tmp = zoomSize.max;
        }
        if (tmp <= zoomSize.min) {
            tmp = zoomSize.min;
        }
        ratio = tmp;
    }

    if (e.type === "pinchmove") {
        currentScale = adjustScale * e.scale;
        ratio = 1 / currentScale;

        if (ratio >= zoomSize.max) {
            ratio = zoomSize.max;
            currentScale = 1 / zoomSize.max;
        }

        if (ratio <= zoomSize.min) {
            ratio = zoomSize.min;
            currentScale = 1 / zoomSize.min;
        }
    }

    //  3.2 進行縮放

    svgElement.setAttribute(
        "viewBox",
        `${startViewBox[0]} ${startViewBox[1]} ${viewport.width * ratio} ${viewport.height * ratio}`
    );

    //  4.將一開始滑鼠的執行縮放位置的 viewPort Client 座標利用新的 CTM ，轉換出對應的 SVG 座標。
    CTM = svgElement.getScreenCTM();
    let moveToSVGPoint = newSVGPoint.matrixTransform(CTM.inverse());

    //  5.取得在縮放過程中該圓點的位移量 `(svgElementX0 - svgElementX1)`。
    let delta = {
        dx: startSVGPoint.x - moveToSVGPoint.x,
        dy: startSVGPoint.y - moveToSVGPoint.y
    };

    //  6.設定最終的 viewBox2
    let middleViewBox = svgElement
        .getAttribute("viewBox")
        .split(" ")
        .map(n => parseFloat(n));
    let moveBackViewBox = `${middleViewBox[0] + delta.dx} ${middleViewBox[1] + delta.dy} ${middleViewBox[2]} ${middleViewBox[3]}`;
    svgElement.setAttribute("viewBox", moveBackViewBox);
}

function pinchend(e) {
    adjustScale = currentScale;
    mc.off("pan");
    setTimeout(mc.on("pan"), 100);
    console.log("pinchend");
}
//  結束：滑鼠縮放的效果
