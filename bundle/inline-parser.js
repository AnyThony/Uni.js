const TOK_START = "{";
const TOK_END = "}";

// scan the raw data for in-line code
function scanForClosure(data) {
    let left = data && data[0] == TOK_START ? 0 : -1;
    let right = -1;

    for (let i = 0; i < data.length - 1; i++) {
        if (data[i] == "\\") {
            continue;
        }
        if (left == -1 && data[i + 1] == TOK_START) {
            left = i + 1;
        }
        else if (data[i + 1] == TOK_END) {
            right = i + 1;
        }

    }

    return [left, right]
}

module.exports = {
    scanForClosure
}