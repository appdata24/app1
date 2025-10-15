// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/services/openrouter.ts
var OPENROUTER_API_KEY = "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";
var OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
async function generateGeometry(description) {
  const prompt = `
B\u1EA1n l\xE0 m\u1ED9t chuy\xEAn gia to\xE1n h\u1ECDc v\xE0 l\u1EADp tr\xECnh 3D. H\xE3y t\u1EA1o m\u1ED9t h\xECnh 3D t\u1EEB m\xF4 t\u1EA3: "${description}"

\u0110\u1EB6C BI\u1EC6T QUAN TR\u1ECCNG - THEO CHU\u1EA8N SGK TO\xC1N H\u1ECCC:
- Material PH\u1EA2I trong su\u1ED1t: THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
- PH\u1EA2I c\xF3 vertices v\u1EDBi c\xE1c nh\xE3n \u0111\xFAng theo SGK:
  * H\xECnh h\u1ED9p: A,B,C,D (\u0111\xE1y d\u01B0\u1EDBi), A',B',C',D' (\u0111\xE1y tr\xEAn)
  * H\xECnh ch\xF3p: S (\u0111\u1EC9nh), A,B,C,D (\u0111\xE1y)
  * L\u0103ng tr\u1EE5: A,B,C (\u0111\xE1y d\u01B0\u1EDBi), A',B',C' (\u0111\xE1y tr\xEAn)
- PH\u1EA2I c\xF3 hiddenEdges: m\u1EA3ng c\xE1c c\u1EB7p \u0111\u1EC9nh t\u1EA1o th\xE0nh c\u1EA1nh b\u1ECB che khu\u1EA5t (v\u1EBD n\xE9t \u0111\u1EE9t)
- \u0110\u01A0N V\u1ECA: PH\u1EA2I d\xF9ng "m" (m\xE9t) cho t\u1EA5t c\u1EA3 k\xEDch th\u01B0\u1EDBc, KH\xD4NG d\xF9ng "\u0111\u01A1n v\u1ECB"

X\u1EEC L\xDD C\xC1C \u0110I\u1EC2M \u0110\u1EB6C BI\u1EC6T (QUAN TR\u1ECCNG):
N\u1EBFu m\xF4 t\u1EA3 c\xF3 c\xE1c \u0111i\u1EC3m ph\u1EE5, PH\u1EA2I th\xEAm v\xE0o vertices v\xE0 auxiliaryLines:
- "SH l\xE0 \u0111\u01B0\u1EDDng cao" \u2192 th\xEAm \u0111i\u1EC3m H (ch\xE2n \u0111\u01B0\u1EDDng cao) v\xE0o vertices, th\xEAm ["S","H"] v\xE0o auxiliaryLines
- "M l\xE0 trung \u0111i\u1EC3m AB" \u2192 t\xEDnh t\u1ECDa \u0111\u1ED9 M = (A+B)/2, th\xEAm v\xE0o vertices
- "O l\xE0 t\xE2m \u0111\xE1y" \u2192 t\xEDnh t\u1ECDa \u0111\u1ED9 t\xE2m, th\xEAm \u0111i\u1EC3m O
- "I l\xE0 giao \u0111i\u1EC3m" \u2192 t\xEDnh t\u1ECDa \u0111\u1ED9 giao \u0111i\u1EC3m, th\xEAm \u0111i\u1EC3m I

V\xCD D\u1EE4: "h\xECnh ch\xF3p SABCD, SH l\xE0 \u0111\u01B0\u1EDDng cao"
- Th\xEAm vertices: [..., {"position": [0, -h/2, 0], "label": "H"}]
- Th\xEAm auxiliaryLines: [["S","H"]] (\u0111\u01B0\u1EDDng cao v\u1EBD n\xE9t \u0111\u1EE9t m\xE0u xanh)
- Th\xEAm properties: "\u0110\u01B0\u1EDDng cao SH": "2 m"

QUY T\u1EAEC \u0110\u1EB6T T\xCAN V\xC0 V\u1ECA TR\xCD \u0110\u1EC8NH:
- H\xECnh h\u1ED9p ABCD.A'B'C'D': 
  * \u0110\xE1y d\u01B0\u1EDBi (y=-h/2): A (tr\u01B0\u1EDBc-tr\xE1i), B (tr\u01B0\u1EDBc-ph\u1EA3i), C (sau-ph\u1EA3i), D (sau-tr\xE1i)
  * \u0110\xE1y tr\xEAn (y=h/2): A' (tr\xEAn A), B' (tr\xEAn B), C' (tr\xEAn C), D' (tr\xEAn D)
  * C\u1EA1nh b\u1ECB che: ["A","D"], ["D","C"], ["A'","D'"], ["D'","C'"], ["D","D'"]

- H\xECnh ch\xF3p SABCD:
  * S \u1EDF \u0111\u1EC9nh [0, h/2, 0]
  * \u0110\xE1y ABCD: A,B,C,D theo th\u1EE9 t\u1EF1 ng\u01B0\u1EE3c chi\u1EC1u kim \u0111\u1ED3ng h\u1ED3 t\u1EEB tr\xEAn nh\xECn xu\u1ED1ng
  * C\u1EA1nh b\u1ECB che: nh\u1EEFng c\u1EA1nh ph\xEDa sau (ph\u1EE5 thu\u1ED9c g\xF3c nh\xECn)

GEOMETRY:
- H\xECnh h\u1ED9p: THREE.BoxGeometry(w, h, d)
- L\u0103ng tr\u1EE5 tam gi\xE1c: THREE.CylinderGeometry(r, r, h, 3)
- L\u0103ng tr\u1EE5 t\u1EE9 gi\xE1c: THREE.BoxGeometry(w, h, d)
- H\xECnh ch\xF3p tam gi\xE1c: THREE.ConeGeometry(r, h, 3)
- H\xECnh ch\xF3p t\u1EE9 gi\xE1c: THREE.ConeGeometry(r, h, 4)

Tr\u1EA3 v\u1EC1 \u0110\xDANG \u0111\u1ECBnh d\u1EA1ng JSON:
{
  "type": "T\xEAn h\xECnh",
  "description": "M\xF4 t\u1EA3",
  "threeJsCode": "...",
  "properties": {...},
  "formulas": [...],
  "vertices": [{"position": [x,y,z], "label": "A"}, ...],
  "hiddenEdges": [["A","D"], ["D","C"], ["D","D'"]],
  "auxiliaryLines": [["S","H"], ["A","M"]] // C\xE1c \u0111\u01B0\u1EDDng ph\u1EE5 (\u0111\u01B0\u1EDDng cao, trung tuy\u1EBFn, etc.)
}

TH\xCAM PARAMETERS, EDGES, V\xC0 ANGLES:
- parameters: m\u1EA3ng c\xE1c tham s\u1ED1 c\xF3 th\u1EC3 ch\u1EC9nh s\u1EEDa (chi\u1EC1u cao, chi\u1EC1u d\xE0i c\u1EA1nh t\u1ED5ng qu\xE1t...)
- edges: m\u1EA3ng T\u1EA4T C\u1EA2 c\xE1c c\u1EA1nh c\u1EE7a h\xECnh v\u1EDBi chi\u1EC1u d\xE0i ri\xEAng l\u1EBB
  * M\u1ED7i edge c\xF3: name (t\xEAn c\u1EA1nh VD: "SA"), from (\u0111\u1EC9nh \u0111\u1EA7u), to (\u0111\u1EC9nh cu\u1ED1i), length (chi\u1EC1u d\xE0i), unit ("m")
  * List \u0110\u1EA6Y \u0110\u1EE6 t\u1EA5t c\u1EA3 c\u1EA1nh trong h\xECnh (c\u1EA1nh \u0111\xE1y, c\u1EA1nh b\xEAn, \u0111\u01B0\u1EDDng cao...)
- angles: m\u1EA3ng c\xE1c g\xF3c quan tr\u1ECDng
  * M\u1ED7i angle c\xF3: name (t\xEAn g\xF3c VD: "SAB"), vertices (3 \u0111\u1EC9nh t\u1EA1o g\xF3c: ["S","A","B"]), value (\u0111\u1ED9 l\u1EDBn g\xF3c), unit ("\u0111\u1ED9" ho\u1EB7c "rad")
  * Bao g\u1ED3m g\xF3c gi\u1EEFa c\u1EA1nh b\xEAn v\xE0 \u0111\xE1y, g\xF3c gi\u1EEFa c\xE1c m\u1EB7t...

V\xCD D\u1EE4 CHO H\xCCNH H\u1ED8P ABCD.A'B'C'D':
{
  "type": "H\xECnh h\u1ED9p ch\u1EEF nh\u1EADt ABCD.A'B'C'D'",
  "description": "H\xECnh h\u1ED9p ch\u1EEF nh\u1EADt c\xF3 8 \u0111\u1EC9nh, 12 c\u1EA1nh v\xE0 6 m\u1EB7t",
  "threeJsCode": "new THREE.Mesh(new THREE.BoxGeometry(3, 2, 2), new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, side: THREE.DoubleSide }))",
  "properties": {
    "Chi\u1EC1u d\xE0i": "3 m",
    "Chi\u1EC1u r\u1ED9ng": "2 m",
    "Chi\u1EC1u cao": "2 m"
  },
  "formulas": [
    {"name": "Th\u1EC3 t\xEDch", "formula": "V = a \xD7 b \xD7 c"}
  ],
  "vertices": [
    {"position": [-1.5, -1, 1], "label": "A"},
    {"position": [1.5, -1, 1], "label": "B"},
    {"position": [1.5, -1, -1], "label": "C"},
    {"position": [-1.5, -1, -1], "label": "D"},
    {"position": [-1.5, 1, 1], "label": "A'"},
    {"position": [1.5, 1, 1], "label": "B'"},
    {"position": [1.5, 1, -1], "label": "C'"},
    {"position": [-1.5, 1, -1], "label": "D'"}
  ],
  "hiddenEdges": [["A","D"], ["D","C"], ["A'","D'"], ["D'","C'"], ["D","D'"]],
  "auxiliaryLines": [],
  "parameters": [
    {"name": "width", "label": "Chi\u1EC1u d\xE0i", "value": 3, "min": 1, "max": 6, "step": 0.5, "unit": "m"},
    {"name": "height", "label": "Chi\u1EC1u cao", "value": 2, "min": 0.5, "max": 5, "step": 0.5, "unit": "m"},
    {"name": "depth", "label": "Chi\u1EC1u r\u1ED9ng", "value": 2, "min": 1, "max": 6, "step": 0.5, "unit": "m"}
  ],
  "edges": [
    {"name": "AB", "from": "A", "to": "B", "length": 3, "unit": "m"},
    {"name": "BC", "from": "B", "to": "C", "length": 2, "unit": "m"},
    {"name": "CD", "from": "C", "to": "D", "length": 3, "unit": "m"},
    {"name": "DA", "from": "D", "to": "A", "length": 2, "unit": "m"},
    {"name": "A'B'", "from": "A'", "to": "B'", "length": 3, "unit": "m"},
    {"name": "B'C'", "from": "B'", "to": "C'", "length": 2, "unit": "m"},
    {"name": "C'D'", "from": "C'", "to": "D'", "length": 3, "unit": "m"},
    {"name": "D'A'", "from": "D'", "to": "A'", "length": 2, "unit": "m"},
    {"name": "AA'", "from": "A", "to": "A'", "length": 2, "unit": "m"},
    {"name": "BB'", "from": "B", "to": "B'", "length": 2, "unit": "m"},
    {"name": "CC'", "from": "C", "to": "C'", "length": 2, "unit": "m"},
    {"name": "DD'", "from": "D", "to": "D'", "length": 2, "unit": "m"}
  ],
  "angles": [
    {"name": "ABC", "vertices": ["A", "B", "C"], "value": 90, "unit": "\u0111\u1ED9"},
    {"name": "BCD", "vertices": ["B", "C", "D"], "value": 90, "unit": "\u0111\u1ED9"},
    {"name": "AA'B", "vertices": ["A", "A'", "B"], "value": 90, "unit": "\u0111\u1ED9"}
  ]
}

V\xCD D\u1EE4 CHO H\xCCNH CH\xD3P SABCD V\u1EDAI \u0110\u01AF\u1EDCNG CAO SH:
{
  "type": "H\xECnh ch\xF3p t\u1EE9 gi\xE1c SABCD",
  "description": "H\xECnh ch\xF3p t\u1EE9 gi\xE1c SABCD c\xF3 \u0111\u1EC9nh S, \u0111\xE1y ABCD l\xE0 h\xECnh vu\xF4ng, SH l\xE0 \u0111\u01B0\u1EDDng cao",
  "threeJsCode": "new THREE.Mesh(new THREE.ConeGeometry(1.5, 3, 4), new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, side: THREE.DoubleSide }))",
  "properties": {
    "C\u1EA1nh \u0111\xE1y": "3 m",
    "Chi\u1EC1u cao SH": "3 m"
  },
  "formulas": [
    {"name": "Th\u1EC3 t\xEDch", "formula": "V = (1/3) \xD7 S_day \xD7 h"}
  ],
  "vertices": [
    {"position": [0, 1.5, 0], "label": "S"},
    {"position": [-1.5, -1.5, 1.5], "label": "A"},
    {"position": [1.5, -1.5, 1.5], "label": "B"},
    {"position": [1.5, -1.5, -1.5], "label": "C"},
    {"position": [-1.5, -1.5, -1.5], "label": "D"},
    {"position": [0, -1.5, 0], "label": "H"}
  ],
  "hiddenEdges": [["C","D"], ["S","D"]],
  "auxiliaryLines": [["S","H"]],
  "parameters": [
    {"name": "base", "label": "C\u1EA1nh \u0111\xE1y", "value": 3, "min": 1, "max": 6, "step": 0.5, "unit": "m"},
    {"name": "height", "label": "Chi\u1EC1u cao", "value": 3, "min": 1, "max": 6, "step": 0.5, "unit": "m"}
  ],
  "edges": [
    {"name": "AB", "from": "A", "to": "B", "length": 3, "unit": "m"},
    {"name": "BC", "from": "B", "to": "C", "length": 3, "unit": "m"},
    {"name": "CD", "from": "C", "to": "D", "length": 3, "unit": "m"},
    {"name": "DA", "from": "D", "to": "A", "length": 3, "unit": "m"},
    {"name": "SA", "from": "S", "to": "A", "length": 3.35, "unit": "m"},
    {"name": "SB", "from": "S", "to": "B", "length": 3.35, "unit": "m"},
    {"name": "SC", "from": "S", "to": "C", "length": 3.35, "unit": "m"},
    {"name": "SD", "from": "S", "to": "D", "length": 3.35, "unit": "m"},
    {"name": "SH", "from": "S", "to": "H", "length": 3, "unit": "m"}
  ],
  "angles": [
    {"name": "SAB", "vertices": ["S", "A", "B"], "value": 60, "unit": "\u0111\u1ED9"},
    {"name": "SBC", "vertices": ["S", "B", "C"], "value": 60, "unit": "\u0111\u1ED9"},
    {"name": "ASB", "vertices": ["A", "S", "B"], "value": 63.4, "unit": "\u0111\u1ED9"},
    {"name": "SHA", "vertices": ["S", "H", "A"], "value": 90, "unit": "\u0111\u1ED9"}
  ]
}

QUAN TR\u1ECCNG: 
- Ch\u1EC9 tr\u1EA3 v\u1EC1 JSON thu\u1EA7n t\xFAy, KH\xD4NG text gi\u1EA3i th\xEDch
- KH\xD4NG t\xEDnh to\xE1n chi ti\u1EBFt hay reasoning
- Tr\u1EA3 v\u1EC1 JSON \u0111\u1EA7u ti\xEAn, ho\xE0n ch\u1EC9nh
- V\u1EDBi b\xE0i to\xE1n ph\u1EE9c t\u1EA1p: \u01AF\u1EDAC L\u01AF\u1EE2NG t\u1ECDa \u0111\u1ED9 h\u1EE3p l\xFD, kh\xF4ng c\u1EA7n t\xEDnh to\xE1n ch\xEDnh x\xE1c 100%
- C\xD4NG TH\u1EE8C: KH\xD4NG d\xF9ng d\u1EA5u ti\u1EBFng Vi\u1EC7t trong subscript/superscript (\u0111\u2192d, \xE1\u2192a). V\xED d\u1EE5: S_day thay v\xEC S_\u0111\xE1y
`;
  try {
    console.log(`[AI] Generating geometry for: "${description}"`);
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5000",
        "X-Title": "Geometry 3D Generator"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b:free",
        messages: [
          {
            role: "system",
            content: "B\u1EA1n l\xE0 chuy\xEAn gia to\xE1n h\u1ECDc. QUAN TR\u1ECCNG: Tr\u1EA3 v\u1EC1 JSON ngay l\u1EADp t\u1EE9c. KH\xD4NG vi\u1EBFt l\u1EDDi gi\u1EA3i th\xEDch hay t\xEDnh to\xE1n chi ti\u1EBFt. CH\u1EC8 tr\u1EA3 v\u1EC1 JSON thu\u1EA7n t\xFAy."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 3e3
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AI] API error ${response.status}:`, errorText);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }
    const data = await response.json();
    console.log(`[AI] Raw response:`, JSON.stringify(data, null, 2));
    let aiResponse = data.choices[0]?.message?.content;
    if (!aiResponse || aiResponse.trim() === "") {
      aiResponse = data.choices[0]?.message?.reasoning;
      console.log(`[AI] No content field, trying reasoning field:`, aiResponse);
    }
    if (!aiResponse || aiResponse.trim() === "") {
      console.error("[AI] No content in response, full data:", JSON.stringify(data, null, 2));
      throw new Error("No response from AI - model returned empty content");
    }
    console.log(`[AI] AI response content:`, aiResponse);
    let jsonText = aiResponse.trim();
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[AI] No JSON found in response");
      throw new Error("Invalid AI response format");
    }
    const result = JSON.parse(jsonMatch[0]);
    console.log(`[AI] Parsed result:`, result);
    if (!result.type || !result.description || !result.threeJsCode) {
      console.error("[AI] Incomplete response structure");
      throw new Error("Incomplete AI response");
    }
    if (!result.edges && result.vertices && result.vertices.length > 0) {
      console.log("[AI] No edges in response, generating from vertices...");
      result.edges = generateEdgesFromVertices(result.vertices, result.hiddenEdges || []);
    }
    if (!result.angles && result.vertices && result.vertices.length >= 3) {
      console.log("[AI] No angles in response, generating key angles...");
      result.angles = generateKeyAngles(result.vertices);
    }
    console.log(`[AI] \u2713 Successfully generated geometry: ${result.type}`);
    return result;
  } catch (error) {
    console.error("[AI] Error in generateGeometry:", error);
    throw error;
  }
}
async function calculateDistance(geometry, distanceMode, selectedElements) {
  const verticesInfo = geometry.vertices?.map((v) => `${v.label}: [${v.position.join(", ")}]`).join("\n") || "";
  const parametersInfo = geometry.parameters?.map((p) => `${p.label}: ${p.value} ${p.unit}`).join("\n") || "";
  const element1 = selectedElements[0];
  const element2 = selectedElements[1];
  let taskDescription = "";
  if (distanceMode === "line-line") {
    taskDescription = `T\xEDnh kho\u1EA3ng c\xE1ch gi\u1EEFa \u0111\u01B0\u1EDDng th\u1EB3ng ${element1.replace("-", "")} v\xE0 \u0111\u01B0\u1EDDng th\u1EB3ng ${element2.replace("-", "")}`;
  } else if (distanceMode === "plane-plane") {
    taskDescription = `T\xEDnh kho\u1EA3ng c\xE1ch gi\u1EEFa m\u1EB7t ph\u1EB3ng ch\u1EE9a ${element1.replace("base-", "").replace("top-", "").replace("side-", "").replace("face-", "")} v\xE0 m\u1EB7t ph\u1EB3ng ch\u1EE9a ${element2.replace("base-", "").replace("top-", "").replace("side-", "").replace("face-", "")}`;
  } else if (distanceMode === "line-plane") {
    const lineElement = selectedElements.find((e) => e.includes("-") && !e.includes("base-") && !e.includes("top-") && !e.includes("side-") && !e.includes("face-"));
    const planeElement = selectedElements.find((e) => e.includes("base-") || e.includes("top-") || e.includes("side-") || e.includes("face-"));
    taskDescription = `T\xEDnh kho\u1EA3ng c\xE1ch t\u1EEB \u0111\u01B0\u1EDDng th\u1EB3ng ${lineElement?.replace("-", "")} \u0111\u1EBFn m\u1EB7t ph\u1EB3ng ch\u1EE9a ${planeElement?.replace("base-", "").replace("top-", "").replace("side-", "").replace("face-", "")}`;
  }
  const prompt = `
B\u1EA1n l\xE0 chuy\xEAn gia to\xE1n h\u1ECDc h\xECnh h\u1ECDc kh\xF4ng gian. H\xE3y gi\u1EA3i b\xE0i to\xE1n sau:

H\xCCNH H\u1ECCC: ${geometry.type}
${geometry.description}

T\u1ECCA \u0110\u1ED8 C\xC1C \u0110\u1EC8NH:
${verticesInfo}

TH\xD4NG S\u1ED0:
${parametersInfo}

B\xC0I TO\xC1N: ${taskDescription}

ELEMENTS \u0110\xC3 CH\u1ECCN:
- Element 1: ${element1}
- Element 2: ${element2}

Y\xCAU C\u1EA6U:
1. X\xE1c \u0111\u1ECBnh t\u1ECDa \u0111\u1ED9 c\xE1c \u0111i\u1EC3m li\xEAn quan
2. T\xEDnh to\xE1n kho\u1EA3ng c\xE1ch theo c\xF4ng th\u1EE9c h\xECnh h\u1ECDc kh\xF4ng gian
3. Tr\u1EA3 v\u1EC1 k\u1EBFt qu\u1EA3 \u0110\xDANG \u0111\u1ECBnh d\u1EA1ng JSON:

{
  "value": <s\u1ED1 kho\u1EA3ng c\xE1ch, \u0111\u01A1n v\u1ECB m\xE9t>,
  "formula": "<c\xF4ng th\u1EE9c LaTeX, VD: d(A, (P)) = \\\\frac{|ax_0 + by_0 + cz_0 + d|}{\\\\sqrt{a^2 + b^2 + c^2}}>",
  "description": "<gi\u1EA3i th\xEDch ng\u1EAFn g\u1ECDn b\u1EB1ng ti\u1EBFng Vi\u1EC7t, VD: Kho\u1EA3ng c\xE1ch t\u1EEB \u0111i\u1EC3m A \u0111\u1EBFn m\u1EB7t ph\u1EB3ng (BCD)>"
}

L\u01AFU \xDD:
- Formula ph\u1EA3i l\xE0 LaTeX h\u1EE3p l\u1EC7, d\xF9ng \\\\frac{}{} cho ph\xE2n s\u1ED1, \\\\sqrt{} cho c\u0103n b\u1EADc hai
- Value ph\u1EA3i l\xE0 s\u1ED1 th\u1EF1c ch\xEDnh x\xE1c
- Description gi\u1EA3i th\xEDch ng\u1EAFn g\u1ECDn, d\u1EC5 hi\u1EC3u
- Kh\xF4ng d\xF9ng k\xFD t\u1EF1 \u0111\u1EB7c bi\u1EC7t ti\u1EBFng Vi\u1EC7t trong formula (\u0111\u2192d, \xF4\u2192o, \xE1\u2192a)

CH\u1EC8 TR\u1EA2 V\u1EC0 JSON, KH\xD4NG GI\u1EA2I TH\xCDCH TH\xCAM.
`;
  console.log("[AI] Calculating distance with prompt:", prompt.substring(0, 500));
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://geometry-viz.replit.app",
      "X-Title": "Geometry Visualization Tool"
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-20b:free",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2e3,
      temperature: 0.3
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("[AI] API error:", errorText);
    throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("AI kh\xF4ng tr\u1EA3 v\u1EC1 k\u1EBFt qu\u1EA3");
  }
  console.log("[AI] Raw response:", content);
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AI kh\xF4ng tr\u1EA3 v\u1EC1 JSON h\u1EE3p l\u1EC7");
  }
  const result = JSON.parse(jsonMatch[0]);
  console.log("[AI] Parsed result:", result);
  return result;
}
function generateEdgesFromVertices(vertices, hiddenEdges) {
  const edges = [];
  const allDistances = [];
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      const v1 = vertices[i];
      const v2 = vertices[j];
      const dx = v2.position[0] - v1.position[0];
      const dy = v2.position[1] - v1.position[1];
      const dz = v2.position[2] - v1.position[2];
      const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
      allDistances.push({ v1, v2, length });
    }
  }
  allDistances.sort((a, b) => a.length - b.length);
  const numEdges = Math.min(12, Math.ceil(vertices.length * 1.5));
  for (let i = 0; i < Math.min(numEdges, allDistances.length); i++) {
    const { v1, v2, length } = allDistances[i];
    const edgeName = `${v1.label}${v2.label}`;
    edges.push({
      name: edgeName,
      from: v1.label,
      to: v2.label,
      length: parseFloat(length.toFixed(2)),
      unit: "m"
    });
  }
  return edges;
}
function generateKeyAngles(vertices) {
  const angles = [];
  if (vertices.length < 3) return angles;
  const maxAngles = Math.min(8, vertices.length * 2);
  for (let centerIdx = 0; centerIdx < vertices.length && angles.length < maxAngles; centerIdx++) {
    const center = vertices[centerIdx];
    const distances = vertices.map((v, idx) => ({
      idx,
      v,
      dist: idx === centerIdx ? Infinity : Math.sqrt(
        Math.pow(v.position[0] - center.position[0], 2) + Math.pow(v.position[1] - center.position[1], 2) + Math.pow(v.position[2] - center.position[2], 2)
      )
    })).filter((d) => d.dist !== Infinity).sort((a, b) => a.dist - b.dist).slice(0, 3);
    for (let i = 0; i < distances.length - 1 && angles.length < maxAngles; i++) {
      for (let j = i + 1; j < distances.length && angles.length < maxAngles; j++) {
        const v1 = distances[i].v;
        const v2 = distances[j].v;
        const vec1 = [
          v1.position[0] - center.position[0],
          v1.position[1] - center.position[1],
          v1.position[2] - center.position[2]
        ];
        const vec2 = [
          v2.position[0] - center.position[0],
          v2.position[1] - center.position[1],
          v2.position[2] - center.position[2]
        ];
        const dot = vec1[0] * vec2[0] + vec1[1] * vec2[1] + vec1[2] * vec2[2];
        const mag1 = Math.sqrt(vec1[0] * vec1[0] + vec1[1] * vec1[1] + vec1[2] * vec1[2]);
        const mag2 = Math.sqrt(vec2[0] * vec2[0] + vec2[1] * vec2[1] + vec2[2] * vec2[2]);
        if (mag1 > 0 && mag2 > 0) {
          const cosAngle = dot / (mag1 * mag2);
          const angleRad = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
          const angleDeg = angleRad * 180 / Math.PI;
          if (angleDeg > 15 && angleDeg < 165) {
            angles.push({
              name: `${v1.label}${center.label}${v2.label}`,
              vertices: [v1.label, center.label, v2.label],
              value: parseFloat(angleDeg.toFixed(1)),
              unit: "\u0111\u1ED9"
            });
          }
        }
      }
    }
  }
  return angles.slice(0, maxAngles);
}

// server/routes.ts
async function registerRoutes(app2) {
  app2.post("/api/generate-geometry", async (req, res) => {
    try {
      const { description } = req.body;
      console.log("[API] Nh\u1EADn request:", description);
      if (!description || typeof description !== "string") {
        console.log("[API] Thi\u1EBFu m\xF4 t\u1EA3");
        return res.status(400).json({
          error: "Vui l\xF2ng cung c\u1EA5p m\xF4 t\u1EA3 h\xECnh kh\xF4ng gian"
        });
      }
      console.log("[API] G\u1ECDi OpenRouter...");
      const result = await generateGeometry(description);
      console.log("[API] Th\xE0nh c\xF4ng, tr\u1EA3 v\u1EC1:", JSON.stringify(result).substring(0, 200));
      res.json(result);
    } catch (error) {
      console.error("[API] L\u1ED7i:", error.message);
      console.error("[API] Stack:", error.stack);
      if (error.message?.includes("429") || error.message?.includes("rate")) {
        return res.status(429).json({
          error: "AI \u0111ang b\u1ECB gi\u1EDBi h\u1EA1n s\u1ED1 l\u01B0\u1EE3ng request. Vui l\xF2ng \u0111\u1EE3i 30-60 gi\xE2y r\u1ED3i th\u1EED l\u1EA1i."
        });
      }
      res.status(500).json({
        error: "AI kh\xF4ng th\u1EC3 t\u1EA1o h\xECnh 3D l\xFAc n\xE0y. Vui l\xF2ng th\u1EED l\u1EA1i sau.",
        details: error.message
      });
    }
  });
  app2.post("/api/calculate-distance", async (req, res) => {
    try {
      const { geometry, distanceMode, selectedElements } = req.body;
      console.log("[API] Distance calculation request:", distanceMode, selectedElements);
      if (!geometry || !distanceMode || !selectedElements || selectedElements.length !== 2) {
        return res.status(400).json({
          error: "Vui l\xF2ng cung c\u1EA5p \u0111\u1EA7y \u0111\u1EE7 th\xF4ng tin: geometry, distanceMode, v\xE0 2 selectedElements"
        });
      }
      console.log("[API] G\u1ECDi AI \u0111\u1EC3 t\xEDnh kho\u1EA3ng c\xE1ch...");
      const result = await calculateDistance(geometry, distanceMode, selectedElements);
      console.log("[API] K\u1EBFt qu\u1EA3 t\xEDnh to\xE1n:", result);
      res.json(result);
    } catch (error) {
      console.error("[API] L\u1ED7i t\xEDnh kho\u1EA3ng c\xE1ch:", error.message);
      if (error.message?.includes("429") || error.message?.includes("rate")) {
        return res.status(429).json({
          error: "AI \u0111ang b\u1ECB gi\u1EDBi h\u1EA1n s\u1ED1 l\u01B0\u1EE3ng request. Vui l\xF2ng \u0111\u1EE3i 30-60 gi\xE2y r\u1ED3i th\u1EED l\u1EA1i."
        });
      }
      res.status(500).json({
        error: "AI kh\xF4ng th\u1EC3 t\xEDnh kho\u1EA3ng c\xE1ch l\xFAc n\xE0y. Vui l\xF2ng th\u1EED l\u1EA1i sau.",
        details: error.message
      });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
import glsl from "vite-plugin-glsl";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    glsl()
    // Add GLSL shader support
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  },
  // Add support for large models and audio files
  assetsInclude: ["**/*.gltf", "**/*.glb", "**/*.mp3", "**/*.ogg", "**/*.wav"]
});

// server/vite.ts
import { nanoid } from "nanoid";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = Number(process.env.PORT) || 5e3;
  const host = process.env.HOST || "127.0.0.1";
  server.listen({
    port,
    host
  }, () => {
    log(`serving on port ${port}`);
  });
})();
