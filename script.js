"use strict";


function parseOBJ(text) {
    const objPositions = [[0, 0, 0]];
    const objTexcoords = [[0, 0]];
    const objNormals = [[0, 0, 0]];

    const objVertexData = [
        objPositions,
        objTexcoords,
        objNormals,
    ];

    let webglVertexData = [
        [],
        [],
        [],
    ];

    const materialLibs = [];
    const geometries = [];
    let geometry;
    let groups = ['default'];
    let material = 'default';
    let object = 'default';

    const noop = () => { };

    function newGeometry() {
        if (geometry && geometry.data.position.length) {
            geometry = undefined;
        }
    }

    function setGeometry() {
        if (!geometry) {
            const position = [];
            const texcoord = [];
            const normal = [];
            webglVertexData = [
                position,
                texcoord,
                normal,
            ];
            geometry = {
                object,
                groups,
                material,
                data: {
                    position,
                    texcoord,
                    normal,
                },
            };
            geometries.push(geometry);
        }
    }

    function addVertex(vert) {
        const ptn = vert.split('/');
        ptn.forEach((objIndexStr, i) => {
            if (!objIndexStr) {
                return;
            }
            const objIndex = parseInt(objIndexStr);
            const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
            webglVertexData[i].push(...objVertexData[i][index]);
        });
    }

    const keywords = {
        v(parts) {
            objPositions.push(parts.map(parseFloat));
        },
        vn(parts) {
            objNormals.push(parts.map(parseFloat));
        },
        vt(parts) {
            objTexcoords.push(parts.map(parseFloat));
        },
        f(parts) {
            setGeometry();
            const numTriangles = parts.length - 2;
            for (let tri = 0; tri < numTriangles; ++tri) {
                addVertex(parts[0]);
                addVertex(parts[tri + 1]);
                addVertex(parts[tri + 2]);
            }
        },
        s: noop,
        mtllib(parts, unparsedArgs) {
            materialLibs.push(unparsedArgs);
        },
        usemtl(parts, unparsedArgs) {
            material = unparsedArgs;
            newGeometry();
        },
        g(parts) {
            groups = parts;
            newGeometry();
        },
        o(parts, unparsedArgs) {
            object = unparsedArgs;
            newGeometry();
        },
    };

    const keywordRE = /(\w*)(?: )*(.*)/;
    const lines = text.split('\n');
    for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
        const line = lines[lineNo].trim();
        if (line === '' || line.startsWith('#')) {
            continue;
        }
        const m = keywordRE.exec(line);
        if (!m) {
            continue;
        }
        const [, keyword, unparsedArgs] = m;
        const parts = line.split(/\s+/).slice(1);
        const handler = keywords[keyword];
        if (!handler) {
            console.warn('unhandled keyword:', keyword);
            continue;
        }
        handler(parts, unparsedArgs);
    }

    for (const geometry of geometries) {
        geometry.data = Object.fromEntries(
            Object.entries(geometry.data).filter(([, array]) => array.length > 0));
    }

    return {
        geometries,
        materialLibs,
    };
}

async function main() {
    /** @type {HTMLCanvasElement} */
    const canvas = document.querySelector("#canvas");
    const gl = canvas.getContext("webgl");

    const baseId = 0;
    const engselId = 1;
    const bladeId = 2;
    const buttonId = 3;
    const motorId = 4;
    const cageLockId = 5;
    const logo1 = 6;
    const topBladeId = 7;
    const logo2 = 8;

    var sliderY = document.getElementById("sliderY");
    var sliderX = document.getElementById("sliderX");
    var sliderZ = document.getElementById("sliderZ");
    var sliderEngsel = document.getElementById("sliderEngsel");
    var spinningBlade = document.getElementById("toggleSpinBlade");
    var spinningMotor = document.getElementById("toggleSpinMotor");

    var isSpinningBlade = true;
    var isSpinningMotor = true;
    var tempAngleMotor = 0;
    var bladeSpinSpeed = 15;

    spinningBlade.addEventListener("click", () => {
        isSpinningBlade = !isSpinningBlade;
    });

    spinningMotor.addEventListener("click", () => {
        isSpinningMotor = !isSpinningMotor;
    });

    if (!gl) {
        return;
    }

    const vs = `
        attribute vec4 a_position;
        attribute vec3 a_normal;

        uniform mat4 u_projection;
        uniform mat4 u_view;
        uniform mat4 u_world;

        varying vec3 v_normal;

        void main() {
            gl_Position = u_projection * u_view * u_world * a_position;
            v_normal = mat3(u_world) * a_normal;
        }
        `;

    const fs = `
        precision mediump float;
    
        varying vec3 v_normal;
    
        uniform vec4 u_diffuse;
        uniform vec3 u_lightDirection;
        uniform float u_lightIntensity;
    
        void main () {
            vec3 normal = normalize(v_normal);
            float fakeLight = dot(u_lightDirection, normal) * 0.5 + 0.5;
            fakeLight *= u_lightIntensity; // Scale light intensity
            gl_FragColor = vec4(u_diffuse.rgb * fakeLight, u_diffuse.a);
        }
        `;



    const meshProgramInfo = webglUtils.createProgramInfo(gl, [vs, fs]);
    const materials = new Map([
        [baseId, [0.970, 0.960, 0.967, 1]],
        [engselId, [0.970, 0.960, 0.967, 1]],
        [motorId, [0.930, 0.930, 0.930, 1]],
        [bladeId, [0.485, 0.950, 0.764, 1]],
        [buttonId, [0.485, 0.950, 0.764, 1]],
        [cageLockId, [0.485, 0.950, 0.764, 1]],
        [logo1, [0.485, 0.950, 0.764, 1]],
        [topBladeId, [0, 0, 0, 1]],
        [logo2, [0.485, 0.950, 0.764, 1]],
    ]);

    var objIndex = 0;
    const response = await fetch('resources/obj/kipas_triangulate_full_fix.obj', { mode: 'cors' });
    const text = await response.text();
    const obj = parseOBJ(text);

    const parts = obj.geometries.map(({ data }) => {

        const bufferInfo = webglUtils.createBufferInfoFromArrays(gl, data);
        return {
            material: {
                u_diffuse: materials.get(objIndex++),
            },
            bufferInfo,
        };
    });

    const cameraTarget = [0, 0, 0];
    const cameraPosition = [0, 0, 4];
    const zNear = 0.1;
    const zFar = 50;

    function degToRad(deg) {
        return deg * Math.PI / 180;
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function render(time) {
        time *= 0.001;

        webglUtils.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0.0, 0.0, 0.1, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);



        const fieldOfViewRadians = degToRad(60);
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const projection = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

        const up = [0, 1, 0];
        var camera = m4.lookAt(cameraPosition, cameraTarget, up);
        const view = m4.inverse(camera);

        var sliderLight = document.getElementById("sliderLight");
        var sliderLightX = document.getElementById("sliderLightX");
        var sliderLightY = document.getElementById("sliderLightY");

        // Inside the render function:
        const sharedUniforms = {
            u_lightDirection: m4.normalize([
                parseFloat(sliderLightX.value),
                parseFloat(sliderLightY.value),
                5
            ]),
            u_view: view,
            u_projection: projection,
            u_lightIntensity: parseFloat(sliderLight.value), // Pass light intensity from slider
        };

        gl.useProgram(meshProgramInfo.program);
        webglUtils.setUniforms(meshProgramInfo, sharedUniforms);

        gl.useProgram(meshProgramInfo.program);
        webglUtils.setUniforms(meshProgramInfo, sharedUniforms);

        const scaleFactor = 0.25;
        const translateY = 0.25;
        const translateX = -0.25;
        const scalingMatrix = m4.scaling(scaleFactor, scaleFactor, scaleFactor);
        const translationMatrix = m4.translation(translateX, translateY, 0);

        if (isSpinningBlade) {
            bladeSpinSpeed = 20;
        }

        else if (bladeSpinSpeed > 0) {
            bladeSpinSpeed *= 0.9;
            if (bladeSpinSpeed <= 0) {
                bladeSpinSpeed = 0;
            }
        }
        const bladeSpinAngle = time * bladeSpinSpeed;
        const bladeSpinMatrix = m4.zRotation(bladeSpinAngle);

        const maxAngle = degToRad(30);
        const minAngle = degToRad(-30);
        var motorSpinDirection = 1;

        var currentMotorSpinAngle = 0;

        if (isSpinningMotor) {
            currentMotorSpinAngle = clamp(Math.sin(time) * Math.PI / 4, minAngle, maxAngle);
            tempAngleMotor = currentMotorSpinAngle;
        }

        else {
            currentMotorSpinAngle = tempAngleMotor;
        }

        if (currentMotorSpinAngle <= minAngle || currentMotorSpinAngle >= maxAngle) {
            motorSpinDirection *= -1;
        }

        const motorSpinMatrix = m4.yRotation(currentMotorSpinAngle);

        for (let index = 0; index < parts.length; ++index) {
            const { bufferInfo, material } = parts[index];

            let u_world;

            if (index != logo2 && index != buttonId) {

                u_world = m4.multiply(translationMatrix, scalingMatrix);
                u_world = m4.yRotate(u_world, degToRad(parseFloat(sliderY.value)));
                u_world = m4.xRotate(u_world, degToRad(parseFloat(sliderX.value)));
                u_world = m4.zRotate(u_world, degToRad(parseFloat(sliderZ.value)));

                if (index == engselId || index == bladeId || index == topBladeId || index == cageLockId || index == logo1 || index == motorId) {
                    const engselSpinMatrix = m4.xRotation(degToRad(parseFloat(sliderEngsel.value)));
                    const pivotEngsel = [0, -2, 3];
    
                    var toPivotMatrix = m4.translation(-pivotEngsel[0], -pivotEngsel[1], -pivotEngsel[2]);
                    var fromPivotMatrix = m4.translation(pivotEngsel[0], pivotEngsel[1], pivotEngsel[2]);
    
                    u_world = m4.multiply(u_world, fromPivotMatrix);
                    u_world = m4.multiply(u_world, engselSpinMatrix);
                    u_world = m4.multiply(u_world, toPivotMatrix);
                }

                if (index == motorId || index == bladeId || index == topBladeId || index == cageLockId || index == logo1) {
                    const pivotMotor = [0, 0, 2.5];

                    toPivotMatrix = m4.translation(-pivotMotor[0], -pivotMotor[1], -pivotMotor[2]);
                    fromPivotMatrix = m4.translation(pivotMotor[0], pivotMotor[1], pivotMotor[2]);

                    u_world = m4.multiply(u_world, fromPivotMatrix);
                    u_world = m4.multiply(u_world, motorSpinMatrix);
                    u_world = m4.multiply(u_world, toPivotMatrix);
                    if (index == bladeId || index == topBladeId) {
                        u_world = m4.multiply(u_world, bladeSpinMatrix);
                    }
                }
            }

            else {
                u_world = m4.multiply(translationMatrix, scalingMatrix);
                u_world = m4.yRotate(u_world, degToRad(parseFloat(sliderY.value)));
                u_world = m4.xRotate(u_world, degToRad(parseFloat(sliderX.value)));
                u_world = m4.zRotate(u_world, degToRad(parseFloat(sliderZ.value)));
            }

            webglUtils.setBuffersAndAttributes(gl, meshProgramInfo, bufferInfo);
            webglUtils.setUniforms(meshProgramInfo, {
                u_world,
                u_diffuse: material.u_diffuse,
            });
            webglUtils.drawBufferInfo(gl, bufferInfo);
        }

        requestAnimationFrame(render);
    }


    requestAnimationFrame(render);
}

main();