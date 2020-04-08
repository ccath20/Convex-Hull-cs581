
    // Get a file as a string using  AJAX
    function loadFileAJAX(name) { //html, javascrpit on server, use ajax: async java and xml
        var xhr = new XMLHttpRequest(),
            okStatus = document.location.protocol === "file:" ? 0 : 200; //okstatus: is this a file? 200 is ok 404 not found 0 is unsuccessful
        xhr.open('GET', name, false); //name is url false means synchronize it
        xhr.send(null);
        return xhr.status == okStatus ? xhr.responseText : null;
    };

    
    function initShaders(gl, vShaderName, fShaderName) { //how to compile
        function getShader(gl, shaderName, type) { //sub functionm shader name = filename
            var shader = gl.createShader(type),
                shaderScript = loadFileAJAX(shaderName); //call funciton above, returns string
            if (!shaderScript) { //if string is empty
                alert("Could not find shader source: "+shaderName);
            }
            gl.shaderSource(shader, shaderScript); //container
            gl.compileShader(shader); //compile it

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                alert(gl.getShaderInfoLog(shader));
                return null;
            }
            return shader;
        }
        var vertexShader = getShader(gl, vShaderName, gl.VERTEX_SHADER), //call twice
            fragmentShader = getShader(gl, fShaderName, gl.FRAGMENT_SHADER),
            program = gl.createProgram();

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            alert("Could not initialise shaders");
            return null;
        }

        
        return program;
    };

