f = open("resources/obj/Kipas_Triangulate.obj", "r").readlines()

gagang_tembok_v = []
gagang_tembok_vn = []
gagang_tembok_vt = []
gagang_tembok_f = []

engsel_naik_turun_v = []
engsel_naik_turun_vn = []
engsel_naik_turun_vt = []
engsel_naik_turun_f = []

putar_v = []
putar_vn = []
putar_vt = []
putar_f = []

object = ""

for line in f:
    line = line.strip().split()
    if line[0] == "o":
        object = line[1]
        print("object = ", object)
    elif line[0] == "v":
        x = float(line[1])
        y = float(line[2])
        z = float(line[3])
        if object == "gagang_tembok":
            gagang_tembok_v.append((x, y, z))
        elif object == "engsel_naik_turun":
            engsel_naik_turun_v.append((x, y, z))
        elif object == "putar":
            putar_v.append((x, y, z))
    elif line[0] == "vn":
        x = float(line[1])
        y = float(line[2])
        z = float(line[3])
        if object == "gagang_tembok":
            gagang_tembok_vn.append((x, y, z))
        elif object == "engsel_naik_turun":
            engsel_naik_turun_vn.append((x, y, z))
        elif object == "putar":
            putar_vn.append((x, y, z))
    elif line[0] == "vt":
        x = float(line[1])
        y = float(line[2])
        if object == "gagang_tembok":
            gagang_tembok_vt.append((x, y))
        elif object == "engsel_naik_turun":
            engsel_naik_turun_vt.append((x, y))
        elif object == "putar":
            putar_vt.append((x, y))
    elif line[0] == "f":
        v = []
        vt = []
        vn = []
        for i in range(1, len(line)):
            vertex = line[i].split("/")
            v.append(int(vertex[0]))
            vt.append(int(vertex[1]))
            vn.append(int(vertex[2]))
        if object == "gagang_tembok":
            gagang_tembok_f.append((v, vt, vn))
        elif object == "engsel_naik_turun":
            engsel_naik_turun_f.append((v, vt, vn))
        elif object == "putar":
            putar_f.append((v, vt, vn))
            
with open("gagang_tembok_v", "w") as file:
    for v in gagang_tembok_v:
        file.write("vec3({},{},{})\n".format(v[0], v[1], v[2]))
        
with open("gagang_tembok_vn", "w") as file:
    for vn in gagang_tembok_vn:
        file.write("vec3({},{},{})\n".format(vn[0], vn[1], vn[2]))
        
with open("gagang_tembok_vt", "w") as file:
    for vt in gagang_tembok_vt:
        file.write("vec2({},{})\n".format(vt[0], vt[1]))
        
with open("gagang_tembok_f", "w") as file:
    for f in gagang_tembok_f:
        for x, y, z in f:
            file.write("vec3({},{},{})\n".format(x, y, z))
        
with open("engsel_naik_turun_v", "w") as file:
    for v in engsel_naik_turun_v:
        file.write("vec3({},{},{})\n".format(v[0], v[1], v[2]))
        
with open("engsel_naik_turun_vn", "w") as file:
    for vn in engsel_naik_turun_vn:
        file.write("vec3({},{},{})\n".format(vn[0], vn[1], vn[2]))
        
with open("engsel_naik_turun_vt", "w") as file:
    for vt in engsel_naik_turun_vt:
        file.write("vec2({},{})\n".format(vt[0], vt[1]))
        
with open("engsel_naik_turun_f", "w") as file:
    for f in engsel_naik_turun_f:
        for x, y, z in f:
            file.write("vec3({},{},{})\n".format(x, y, z))
        
with open("putar_v", "w") as file:
    for v in putar_v:
        file.write("vec3({},{},{})\n".format(v[0], v[1], v[2]))
        
with open("putar_vn", "w") as file:
    for vn in putar_vn:
        file.write("vec3({},{},{})\n".format(vn[0], vn[1], vn[2]))
        
with open("putar_vt", "w") as file:
    for vt in putar_vt:
        file.write("vec2({},{})\n".format(vt[0], vt[1]))
        
with open("putar_f", "w") as file:
    for f in putar_f:
        for x, y, z in f:
            file.write("vec3({},{},{})\n".format(x, y, z))
        
print("done")