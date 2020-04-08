/*
Convex Hull
CS 581
Project 
*/
var canvas;
var gl;
var vPosition;
var fColor;




var points = [];
var Stack = [];

var LinesFromOriginGS = [];

var incGS = 3;

var pointsJM = [];
var convexHullLines = [];
var rightSideJM = true;
var runJM = false;

var quickHullLines = []; 



function Line(s, e, co) {
    this.vBuffer;
    this.p1 = s;
    this.p2 = e;
    this.color = co;
    this.points = vec4(s[0], s[1], e[0], e[1]); 
   
    this.init = function () {
        this.vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW);

    }

    this.draw = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
       
        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        gl.uniform4fv(fColor, this.color);
        
        gl.drawArrays(gl.LINES, 0, 2);
     
    }

}

function Point(cp,color1, angle1){
    this.vBuffer;
    this.origin = cp;
    this.color = color1;
    this.points = [];
    this.angle = angle1;
    
    this.init = function(){
     
        this.vBuffer = gl.createBuffer();
       
        var x = cp[0];
        var y = cp[1];

        this.points.push(x); this.points.push(y);

        var offset = .008;

        this.points.push(x + offset); this.points.push(y + offset); //top right
        this.points.push(x - offset); this.points.push(y + offset); //top left
        this.points.push(x - offset); this.points.push(y - offset); //bottom left
        this.points.push(x + offset); this.points.push(y - offset); //bottom right
        this.points.push(x + offset); this.points.push(y + offset); //top right

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW);

    }

    this.draw = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);
        gl.uniform4fv(fColor, flatten(this.color));
        gl.drawArrays(gl.TRIANGLE_FAN, 0, this.points.length/2);
     
    }

    this.getY = function () {
        return this.origin[1];
    }
    this.getAngle = function () {
        return this.angle;
    }
    this.setAngle = function (s) {
        this.angle = s;
    }

    this.setColor =  function (s) {
        this.color = s;
    }


}


function resetVars() {
    points = [];
    LinesFromOriginGS = [];
    convexHullLines = [];
    Stack = [];
    incGS = 3;
    quickHullLines = [];
    rightSideJM = true;
}

function resetAlg() {
   
    LinesFromOriginGS = [];
    convexHullLines = [];
    Stack = [];
    incGS = 3;
    rightSideJM = true;
}


function drawLinesFromOrigin() {
    for (var i = 1; i < points.length; i++) {
        var temp = new Line(points[0].origin, points[i].origin, vec4(0, 0, 0, .1));
        temp.init();
        LinesFromOriginGS.push(temp);
    }

}

function addAngles() {
    for (var i = 1; i < points.length; i++) {
        var temp = vec3(points[0].points[0] +30,0,0);
        points[i].setAngle(find_angle(points[i].points, points[0].points, temp));
    }
}

var doneWithAlg = false;


function isLeftOfLine(a,b,c) {

    return ((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) > 0;
}

function partitionFromLine(line, points){

    var left = [];
    var right = [];

    
    for (var i = 0; i < points.length; i++) {
        if (!(points[i] == Stack[0] || points[i] == Stack[1])) {
            if (isLeftOfLine(line.p1, line.p2, points[i].origin)) {
                left.push(points[i]);
            }
            else {
                right.push(points[i]);
            }
        }
        else {
            //alert("should see 2 of these");
        }
    }

    return [left, right];
}


function setPointsColor(pts, color) {
    for (var i = 0; i < pts.length; i++) {
        pts[i].setColor(color);
    }
}

function tringleArea(p, a, b) {
    return .5 * Math.abs((a[0] - p[0]) * (b[1] - a[1]) - (a[0] - b[0]) * (p[1] - a[1]));
}

function findFarthest(sk, p, q){
    var farthest = sk[0];
    var farthestLength = tringleArea(sk[0].origin, p.origin, q.origin);
    for (var i = 0; i < sk.length; i++) {
        if (tringleArea(sk[i].origin, p.origin, q.origin) > farthestLength) {
            farthest = sk[i];
            farthestLength = tringleArea(sk[i].origin, p.origin, q.origin);
        }
    }

    return farthest;
}


function area( x1,  y1,  x2,  y2,  x3,  y3)
{
    return Math.abs((x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2.0);
} 

function  isInside( x1,  y1,  x2,  y2,  x3,  y3,  x,  y)
{
    /* Calculate area of triangle ABC */
    var A = area(x1, y1, x2, y2, x3, y3);

    /* Calculate area of triangle PBC */
    var A1 = area(x, y, x2, y2, x3, y3);

    /* Calculate area of triangle PAC */
    var A2 = area(x1, y1, x, y, x3, y3);

    /* Calculate area of triangle PAB */
    var A3 = area(x1, y1, x2, y2, x, y);

    /* Check if sum of A1, A2 and A3 is same as A */
    return Math.abs(A - ( A1 + A2 + A3) )< .000000000001;
} 

function getInsidepoints(pts, x, y, z) {
    var ip = [];
    for (var i = 0; i < pts.length; i++) {
        if (pts[i] != x && pts[i] != y && pts[i] != z) {

           // pts[i].setColor(Colors[0]);
            //render();

            if (isInside(x[0], x[1], y[0], y[1], z[0], z[1], pts[i].origin[0], pts[i].origin[1])) {
                ip.push(pts[i]);

            }

            else {
               // alert("outside");
            }
        }
            
    }
    return ip;
}




function FindHull(Sk, p, q) {
    if (Sk.length == 0) {
        return;
    }

    var C = findFarthest(Sk, p, q);
    C.setColor(Colors[5]);
    

    var line1 = new Line(C.origin, p.origin, Colors[0]);
    line1.init();

    convexHullLines.push(line1);

    var line2 = new Line(C.origin, q.origin, Colors[0]);
    line2.init();

    convexHullLines.push(line2);

    render();


    var S0 = getInsidepoints(Sk, p.origin, C.origin, q.origin);
    setPointsColor(S0, Colors[0]);
    render();


   // console.log(S0);
    var validPoints = Sk.filter(function (item) {
        return !S0.includes(item);
    });
    console.log(validPoints);
    var S1 = partitionFromLine(line1, validPoints)[1];
    var S2 = partitionFromLine(line1, validPoints)[0];//  partitionFromLine(line2, validPoints)[1];

    console.log("s1 " + S1);
    console.log("s2 " + S2);


    var c = document.getElementById("delaytime");

    setTimeout(function () { FindHull(S1, p, C); FindHull(S2, C, q); }, c.value * 1000);

    
   
    
    
}

function startQH() {
    if (convexHullLines.length != 1) {
        alert("ERROR on Quick hull");
        return;
    }
    var bothSets = partitionFromLine(convexHullLines[0], points);
    setPointsColor(bothSets[0], Colors[1]);
    setPointsColor(bothSets[1], Colors[3]);
    var l = pop();
    var r = pop();
    render();



    var c = document.getElementById("delaytime");



    setTimeout(function () { FindHull(bothSets[1], l, r); FindHull(bothSets[0], r, l); }, c.value * 1000);

   
    

    render();
    

}

var nextStepQH = false;

function findLeftAndRight(){
    var l = points[0];
    var r = points[0];
  
    for (var i = 0; i < points.length; i++) {

        if (points[i].origin[0] < l.origin[0]) {
            l = points[i];
        }

        if (points[i].origin[0] > r.origin[0]) {
            r = points[i];
        }
    }
    return [l, r];
}

function quickHull() {
    resetAlg();
    var lAndR = findLeftAndRight();
    push(lAndR[0]);
    push(lAndR[1]);
    lAndR[0].setColor(Colors[4]);
    lAndR[1].setColor(Colors[2]);
    var l = lAndR[0].origin;
    var r = lAndR[1].origin;

    var temp = new Line(l,r, Colors[0]);
    temp.init();
   
    convexHullLines.push(temp);
   
    render();
}

function JarvisMarch() {
    resetAlg();
    points.sort(compareY);
    push(points[0]);
    points[0].setColor(Colors[1]);
    points[points.length - 1].setColor(Colors[3]);
    doneWithAlg = false;
    render();
}

function stepJM(){
    var temp = peek();
    if (rightSideJM && temp != points[points.length - 1]) {//truly right side
        
        
        var list = getPossiblePoints();
       getNextPointJM(temp, list, 0); 

    }

    else {


        if (temp == points[points.length - 1]) {// reached highest point
            rightSideJM = false;          
        }

        if (temp == points[0]) {
            doneWithAlg = true;
            runJM = false;
            return;
        }
        var list = getPossiblePoints();
        list.push(Stack[0]);//adds original point to ;ist because getPossible points filters it out
        getNextPointJM(temp, list, 0);

    }
    updateConvexHullLines();
    render();



}


function getNextPointJM(currentPoint, list, i) {
    var tC = 0;
    if (i == list.length) { 
        if (runJM) {

            var c = document.getElementById("delaytime");
            setTimeout(stepJM, c.value * 10);
        }

        return;
    }
    if (i == 0) {
      
        push(list[i]);    
    }

    else {
        if (calcA(currentPoint, peek()) > calcA(currentPoint, list[i])) {
            pop();
            push(list[i]);   
            tC = 500;
        }
    }
    updateConvexHullLines();
    render();
    

    setTimeout(function () { getNextPointJM(currentPoint, list, i + 1); }, tC);

}


function getPossiblePoints(currentPoint) {
    var list = [];
    for (var i = 0; i < points.length; i++) {
        var temp = points[i];
        if (Stack.indexOf(temp) == -1) {// not in stack
            list.push(temp);
        }
    }
    return list;
}

function GramScan() {
    resetAlg()
    points.sort(compareY);

    addAngles();
    points.sort(compareA);

    for (var i = 0; i < points.length; i++) {
        points[i].setColor(Colors[i % Colors.length]);
    }
    removeDuplicateAngles();
    drawLinesFromOrigin();

   
    push(points[0]);
    push(points[1]);
    push(points[2]);
    incGS = 3;


    doneWithAlg = false;
    updateConvexHullLines();
    render();
}


function printStackColors() {

    var str = [];

    for (var i = 0; i < Stack.length; i++) {
        str  =  str + retColor( Stack[i].color) + " ";
    }
    console.log(str);
}

function stepGS() {
    if (incGS == points.length) {
        doneWithAlg = true;
        push(points[0]);
        //alert("Gram Scan is done. Number of verticies on the Convex Hull is " );
        updateConvexHullLines();
        render();
        return;
    }
        

    var a = Stack[Stack.length - 2];
    var b = Stack[Stack.length - 1];
    var c = points[incGS];

    if (!isLeftTurn(a, b, c)) {
      
        pop();
        
        printStackColors();
        updateConvexHullLines();
        render();
        return;
    }
    else {   
        push(points[incGS]);
        incGS++;
        printStackColors();
        updateConvexHullLines();
        render();
    }
}



function calcA(a,b) {


    var s = a.origin;
    var t = b.origin;
    var cx = s[0]; var cy = s[1];
    var ex = t[0]; var ey = t[1];
    var dy = ey - cy;
    var dx = ex - cx;
    var theta = Math.atan2(dy, dx); // range (-PI, PI]
    theta *= 180 / Math.PI; // rads to degs, range (-180, 180]

    if (!rightSideJM) {
        theta -= 180;
    }

    if (theta < 0) theta = 360 + theta; // range [0, 360)
    return theta;
}

function retAngle(s, t) {

    var cx = s[0]; var cy = s[1];
    var ex = t[0]; var ey = t[1];
    var dy = ey - cy;
    var dx = ex - cx;
    var theta = Math.atan2(dy, dx); // range (-PI, PI]
    theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
    if (theta < 0) theta = 360 + theta; // range [0, 360)
    return theta;
}

function isLeftTurn(a, b, c) {

    var ang1 = retAngle(a.origin, b.origin);
    var ang2 = retAngle(b.origin, c.origin);

    return ang1 < ang2;
 
}



function updateConvexHullLines() {
    convexHullLines = [];
    for (var i = 0; i < Stack.length - 1; i++) {
        var temp = new Line(Stack[i].origin, Stack[i + 1].origin, Colors[0]);
        temp.init();
        convexHullLines.push(temp);
    }
}

function push(i) {
    Stack.push(i);
}

function pop() {
    return Stack.pop();
}

function peek() {
    return Stack[Stack.length - 1];
}

function compareY(a, b) {
    return a.getY() - b.getY();
}

function compareA(a, b) {
    return a.getAngle() - b.getAngle();
}



function removeDuplicateAngles() {
  
     for (var i = 0; i < points.length - 1; i++) {

         if (points[i].getAngle() == points[i +1].getAngle()) {
                
                console.log("Collision on verticies");
                removeOneofAngles(i, i + 1);
                i--;
         }
     }
}

function find_angle(A, B, C) {
    var AB = Math.sqrt(Math.pow(B[0] - A[0], 2) + Math.pow(B[1] - A[1], 2));
    var BC = Math.sqrt(Math.pow(B[0] - C[0], 2) + Math.pow(B[1] - C[1], 2));
    var AC = Math.sqrt(Math.pow(C[0] - A[0], 2) + Math.pow(C[1] - A[1], 2));
    return Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB));
}


function removeOneofAngles(i, j) {
    var distanceI = 0;
    var distanceJ = 0;
    if (distanceI < distanceJ) {
        //removeI
    }
    else if (distanceI > distanceJ) {
        //removeJ
    }
    else {
        console.log("Identical points");
        //remove either
    }

}

function addspecialPoints() {

}

function drawPoints() {

    for (var i = 0; i < points.length; i++){
        points[i].draw();
    }
    for (var i = 0; i < points.length; i++) {
        points[i].draw();
    }

}

function drawLines() {

 
    for (var i = 0; i < LinesFromOriginGS.length; i++){
        if(showOriginLines)
        LinesFromOriginGS[i].draw();
    }
    for (var i = 0; i < convexHullLines.length; i++){
        convexHullLines[i].draw();
    }

}


function createPoints() {

    resetVars();
    createRandomPoints(document.getElementById("pointC").value);
    addspecialPoints();

    render();


}

function createRandomPoints(num) {
    for (var i = 0; i < num; i++) {
        var edge1 = Math.random() + .8; //1.65;//1.5 is max
        var edge2 = Math.random() + .8; //1.65;//1.5 is max
        var temp = new Point(vec2(Math.random() * edge1, Math.random() * edge2), Colors[0], 0);
        temp.init();
        points.push(temp); //between 0 and 1, offset by -5 in html to center


    }
}

function render() {

    gl.clear( gl.COLOR_BUFFER_BIT );
    drawPoints();
    drawLines();
}


window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    //
    //  Configure WebGL
    //
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, .8, 1.0);

    //  Load shaders and initialize attribute buffers

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);


    vPosition = gl.getAttribLocation(program, "vPosition");
    fColor = gl.getUniformLocation(program, "fColor");

    

    initializeButtons();

    render();
};

var showOriginLines = false;
function toggleShowOriginLines(){
    showOriginLines = !showOriginLines;
}

function startGS() {
    if (doneWithAlg)
        return;

    var c = document.getElementById("delaytime");
    //console.log(c.value)

    stepGS();

    setTimeout(startGS, c.value *1000);

}

function startJM() {
    runJM = true;
    stepJM();
}

function initializeButtons() {

 

    document.getElementById("toggleLines").addEventListener("click", function () {
        
        toggleShowOriginLines();
        render();
    });

    

    document.getElementById("newG").addEventListener("click", function () {
        createPoints();
        render();
    });

  

    document.getElementById("setupGS").addEventListener("click", function () {
        
        GramScan();

    });

    document.getElementById("stepButtonGS").addEventListener("click", function () {
        stepGS();
    });

    document.getElementById("startGS").addEventListener("click", function () {
        startGS();
    });


    document.getElementById("setupJM").addEventListener("click", function () {

        JarvisMarch();

    });

    document.getElementById("stepButtonJM").addEventListener("click", function () {

        stepJM();

    });

    document.getElementById("startJM").addEventListener("click", function () {

        startJM();

    });

    document.getElementById("setupQH").addEventListener("click", function () {

        quickHull();

    });

    document.getElementById("stepButtonQH").addEventListener("click", function () {
        nextStepQH = true;
        //stepQH();

    });

    document.getElementById("startQH").addEventListener("click", function () {

        startQH();

    });

}

var Colors = [
    [0.0, 0.0, 0.0, 1.0], //black
    [1.0, 0.0, 0.0, 1.0], //red
  
    [0.0, 1.0, 0.0, 1.0], // green
    [0.0, 0.0, 1.0, 1.0], //blue
    [1.0, 0.0, 1.0, 1.0], //magenta
    [0.0, 1.0, 1.0, 1.0], // cyan
    //[1.0, 1.0, 1.0, 1.0] //white
];


function retColor(arr) {
    if (arr[0] == 0) {
        if (arr[1] == 0) {//1st 2 zero
            if (arr[2] == 0) {
                return "BLACK";
            }
            else if (arr[2] == 1) {
                return "BLUE";
            }
        }
        else if (arr[1] == 1) {//0,1
            if (arr[2] == 0) {
                return "GREEN";
            }
            else if (arr[2] == 1) {
                return "CYAN"
            }
        }
    }
    else if (arr[0] == 1) {
        if (arr[1] == 0) {
            if (arr[2] == 0) {
                return "RED";
            }
            else if (arr[2] == 1) {
                return "MAGENTA";
            }
        }

    }
    return "CANT FIND COLOR";
}




