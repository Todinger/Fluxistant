
function ellipseFromPoints(x1, y1, x2, y2) {
    const x1sq = x1 * x1;
    const y1sq = y1 * y1;
    const x2sq = x2 * x2;
    const y2sq = y2 * y2;
    const numerator = x1sq * y2sq - x2sq * y1sq;
    const asq = numerator / (y2sq - y1sq);
    const bsq = numerator / (x1sq - x2sq);
    const a = sqrt(abs(asq));
    const b = sqrt(abs(bsq));
    console.log(`Calc: asq = ${asq}, bsq = ${bsq}, a = ${a}, b = ${b}, x1 = ${x1}, y1 = ${y1}, x2 = ${x2}, y2 = ${y2}`);
    return [asq, bsq];
}

function parameterizePointOnEllipse(a, x) {
    return acos(x / a);
}

function getPointOnEllipseAtY(a, b, t, y) {
    return createVector(a * cos(t), y, b * sin(t));
}


function v2s(vec) {
    return `(${vec.x}, ${vec.y}, ${vec.z})`;
}

