'use strict'

const DATA_TYPE = Uint32Array
const BLOCK_BIT_NUM = DATA_TYPE.BYTES_PER_ELEMENT * 8
const BIT_MOVE = Math.log2(BLOCK_BIT_NUM)
const BIT_MASK = (1 << BIT_MOVE) - 1

/**
const COUNT_TABLE = []
for (let i = 0 i < 256 i++) {
    let count = 0
    for (let j = 0 j < 8 j++) {
        if (i & (1 << j)) {
            count++
        }
    }
    COUNT_TABLE[i] = count
}
*/
const COUNT_TABLE = [
    0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4,
    1, 2, 2, 3, 2, 3, 3, 4, 2, 3, 3, 4, 3, 4, 4, 5,
    1, 2, 2, 3, 2, 3, 3, 4, 2, 3, 3, 4, 3, 4, 4, 5,
    2, 3, 3, 4, 3, 4, 4, 5, 3, 4, 4, 5, 4, 5, 5, 6,
    1, 2, 2, 3, 2, 3, 3, 4, 2, 3, 3, 4, 3, 4, 4, 5,
    2, 3, 3, 4, 3, 4, 4, 5, 3, 4, 4, 5, 4, 5, 5, 6,
    2, 3, 3, 4, 3, 4, 4, 5, 3, 4, 4, 5, 4, 5, 5, 6,
    3, 4, 4, 5, 4, 5, 5, 6, 4, 5, 5, 6, 5, 6, 6, 7,
    1, 2, 2, 3, 2, 3, 3, 4, 2, 3, 3, 4, 3, 4, 4, 5,
    2, 3, 3, 4, 3, 4, 4, 5, 3, 4, 4, 5, 4, 5, 5, 6,
    2, 3, 3, 4, 3, 4, 4, 5, 3, 4, 4, 5, 4, 5, 5, 6,
    3, 4, 4, 5, 4, 5, 5, 6, 4, 5, 5, 6, 5, 6, 6, 7,
    2, 3, 3, 4, 3, 4, 4, 5, 3, 4, 4, 5, 4, 5, 5, 6,
    3, 4, 4, 5, 4, 5, 5, 6, 4, 5, 5, 6, 5, 6, 6, 7,
    3, 4, 4, 5, 4, 5, 5, 6, 4, 5, 5, 6, 5, 6, 6, 7,
    4, 5, 5, 6, 5, 6, 6, 7, 5, 6, 6, 7, 6, 7, 7, 8
]

const KEY_TABLE = []
const STR_TO_NUM = {}
const NUM_TO_STR = []
for (let i = 0; i < 256; i++) {
    KEY_TABLE[i] = []
    let str = ''
    for (let j = 0; j < 8; j++) {
        if (i & (1 << j)) {
            str += '1'
            KEY_TABLE[i].push(j)
        } else {
            str += '0'
        }
    }
    NUM_TO_STR[i] = str
    STR_TO_NUM[str] = i
}


class BitArray {
    constructor(data, val = 0) {
        let type = typeof data
        if (type == 'number') { //specified the BitArray length
            this._length = data
            this._data = new DATA_TYPE(this.blockSize())
            if (val === 1) {
                this._data.fill(-1)
                this._cat()
            }
        } else if (type == 'string' || Array.isArray(data)) { //data from toString() or toArray()
            this._length = data.length
            let blockSize = this.blockSize()
            this._data = new DATA_TYPE(blockSize)
            for (let i = 0; i < blockSize; i++) {
                let v = 0
                for (let j = 0; j < BLOCK_BIT_NUM; j++) {
                    v += Number(data[i * BLOCK_BIT_NUM + j] || 0) << j
                }
                this._data[i] = v
            }
        } else if (type == 'object' && 'rawdata' in data) { //data from rawData()
            this._length = data.length
            this._data = DATA_TYPE.from(data.rawdata)
        } else if (data instanceof BitArray) { //data from another BitArray
            this._length = data._length
            this._data = new DATA_TYPE(data._data)
        } else {
            throw new TypeError('')
        }
    }

    blockSize() {
        return (this._length + BLOCK_BIT_NUM - 1) >> BIT_MOVE
    }

    blockBitNum() {
        return BLOCK_BIT_NUM
    }

    get length() {
        return this._length
    }

    set(index, val = 1) {
        val = !val ? 0 : 1
        let majorIndex = index >> BIT_MOVE
        let minorIndex = index & BIT_MASK
        val ? this._data[majorIndex] |= 1 << minorIndex : this._data[majorIndex] &= ~(1 << minorIndex)
    }

    get(index) {
        let majorIndex = index >> BIT_MOVE
        let minorIndex = index & BIT_MASK
        return (this._data[majorIndex] >> minorIndex) & 1
    }

    not(index) {
        if (index !== undefined) {
            let majorIndex = index >> BIT_MOVE
            let minorIndex = index & BIT_MASK
            this._data[majorIndex] ^= 1 << minorIndex
        } else {
            let blockSize = this.blockSize()
            let data = this._data
            for (let i = 0; i < blockSize; i++) {
                data[i] = ~data[i]
            }
            this._cat()
        }
        return this
    }

    and(index, val) {
        if (index instanceof BitArray) {
            val = index
            let blockSize = this.blockSize()
            let data = this._data
            let otherData = val._data
            for (let i = 0; i < blockSize; i++) {
                data[i] &= otherData[i]
            }
            this._cat()
        } else {
            this._data[index >> BIT_MOVE] &= this._mask1(index, val)
        }
        return this
    }

    or(index, val) {
        if (index instanceof BitArray) {
            val = index
            let blockSize = this.blockSize()
            let data = this._data
            let otherData = val._data
            for (let i = 0; i < blockSize; i++) {
                data[i] |= otherData[i]
            }
            this._cat()
        } else {
            this._data[index >> BIT_MOVE] |= this._mask0(index, val)
        }
        return this
    }

    xor(index, val) {
        if (index instanceof BitArray) {
            val = index
            let blockSize = this.blockSize()
            let data = this._data
            let otherData = val._data
            for (let i = 0; i < blockSize; i++) {
                data[i] ^= otherData[i]
            }
            this._cat()
        } else {
            this._data[index >> BIT_MOVE] ^= this._mask0(index, val)
        }
        return this
    }

    equal(other) {
        if (other._length != this._length) {
            return false
        }
        let blockSize = this.blockSize()
        let data = this._data
        let otherData = other._data
        for (let i = 0; i < blockSize; i++) {
            if (data[i] != otherData[i]) {
                return false
            }
        }
        return true
    }

    _cat() {
        this._data[this._length >> BIT_MOVE] &= this._maskR(this._length)
    }

    _maskR(index) {
        return (1 << (index & BIT_MASK)) - 1
    }
    _maskL(index) {
        return ~this._maskR(index)
    }
    _mask0(index, val) {
        val = val ? 1 : 0
        return val << (index & BIT_MASK)
    }
    _mask1(index, val) {
        return ~this._mask0(index, val ? 0 : 1)
    }

    _blockBytes(blockIndex) {
        let v = this._data[blockIndex]
        return [
            v & 0xff,
            (v >> 8) & 0xff,
            (v >> 16) & 0xff,
            (v >> 24) & 0xff
        ]
    }

    _setBlock(blockIndex, v0 = 0, v1 = 0, v2 = 0, v3 = 0) {
        this._data[blockIndex] = v0 & (v1 << 8) & (v2 << 16) & (v3 << 24);
    }

    fill(val, begin = 0, end = this._length) {
        begin = begin < 0 ? this._length + begin : begin
        end = end < 0 ? this._length + end : end
        if (begin == end) {
            return this
        }
        val = !val ? 0 : 1
        let majorBegin = begin >> BIT_MOVE
        let majorEnd = end >> BIT_MOVE
        let thisData = this._data
        val = -val
        for (let i = majorBegin + 1; i < majorEnd; i++) {
            thisData[i] = val
        }

        if (majorBegin == majorEnd) {
            if (val == 0) {
                thisData[majorBegin] &= this._maskR(begin) | this._maskL(end)
            } else {
                thisData[majorBegin] |= this._maskL(begin) & this._maskR(end)
            }
        } else {
            if (val == 0) {
                thisData[majorBegin] &= this._maskR(begin)
                thisData[majorEnd] &= this._maskL(end)
            } else {
                thisData[majorBegin] |= this._maskL(begin)
                thisData[majorEnd] |= this._maskR(end)
            }
        }
        return this
    }

    cover(other, begin = 0, end = this._length) {
        begin = begin < 0 ? this._length + begin : begin
        end = end < 0 ? this._length + end : end
        if (begin == end) {
            return this
        }
        let majorBegin = begin >> BIT_MOVE
        let majorEnd = end >> BIT_MOVE
        let thisData = this._data
        let otherData = other._data
        for (let i = majorBegin + 1; i < majorEnd; i++) {
            thisData[i] = otherData[i]
        }
        if (majorBegin == majorEnd) {
            thisData[majorBegin] &= this._maskR(begin) | this._maskL(end)
            thisData[majorBegin] |= this._maskL(begin) & this._maskR(end) & otherData[majorBegin]
        } else {
            thisData[majorBegin] &= this._maskR(begin)
            thisData[majorBegin] |= this._maskL(begin) & otherData[majorBegin]

            thisData[majorEnd] &= this._maskL(end)
            thisData[majorEnd] |= this._maskR(end) & otherData[majorEnd]
        }
        return this
    }

    swap(other, begin = 0, end = this._length) {
        begin = begin < 0 ? this._length + begin : begin
        end = end < 0 ? this._length + end : end
        if (begin == end) {
            return this
        }
        let majorBegin = begin >> BIT_MOVE
        let majorEnd = end >> BIT_MOVE
        let thisData = this._data
        let otherData = other._data
        let temp
        for (let i = majorBegin + 1; i < majorEnd; i++) {
            temp = thisData[i]
            thisData[i] = otherData[i]
            otherData[i] = temp
        }
        if (majorBegin == majorEnd) {
            temp = thisData[majorBegin]
            thisData[majorBegin] &= this._maskR(begin) | this._maskL(end)
            thisData[majorBegin] |= this._maskL(begin) & this._maskR(end) & otherData[majorBegin]
            otherData[majorBegin] &= this._maskR(begin) | this._maskL(end)
            otherData[majorBegin] |= this._maskL(begin) & this._maskR(end) & temp
        } else {
            temp = thisData[majorBegin]
            thisData[majorBegin] &= this._maskR(begin)
            thisData[majorBegin] |= this._maskL(begin) & otherData[majorBegin]
            otherData[majorBegin] &= this._maskR(begin)
            otherData[majorBegin] |= this._maskL(begin) & temp

            temp = thisData[majorEnd]
            thisData[majorEnd] &= this._maskL(end)
            thisData[majorEnd] |= this._maskR(end) & otherData[majorEnd]
            otherData[majorEnd] &= this._maskL(end)
            otherData[majorEnd] |= this._maskR(end) & temp
        }
        return this
    }

    *[Symbol.iterator]() {
        for (let i = 0; i < this._length; i++) {
            yield this.get(i)
        }
    }

    entries() {
        let self = this
        return {
            * [Symbol.iterator]() {
                for (let i = 0; i < self._length; i++) {
                    yield [i, self.get(i)]
                }
            }
        }
    }

    count() {
        let count = 0
        let blockSize = this.blockSize()
        let data = this._data
        for (let i = 0; i < blockSize; i++) {
            let v = this._blockBytes(i)
            count += COUNT_TABLE[v[0]] + COUNT_TABLE[v[1]] + COUNT_TABLE[v[2]] + COUNT_TABLE[v[3]]
        }
        return count
    }

    forEach(cb) {
        for (let i = 0; i < this._length; i++) {
            cb(this.get(i), i, this)
        }
    }

    forExist(cb) {
        let blockSize = this.blockSize()
        let data = this._data
        for (let i = 0; i < blockSize; i++) {
            let index = i << BIT_MOVE
            let v = this._blockBytes(i)
            KEY_TABLE[v[0]].forEach(k => cb(k + index))
            KEY_TABLE[v[1]].forEach(k => cb(k + 8 + index))
            KEY_TABLE[v[2]].forEach(k => cb(k + 16 + index))
            KEY_TABLE[v[3]].forEach(k => cb(k + 24 + index))
        }
    }

    toArray() {
        return [...this]
    }

    rawData() {
        return {
            length: this._length,
            rawdata: Array.from(this._data)
        }
    }

    toString(type) {
        let blockSize = this.blockSize()
        let strBlocks = []
        for (let i = 0; i < blockSize - 1; i++) {
            let v = this._blockBytes(i)
            strBlocks.push(NUM_TO_STR[v[0]])
            strBlocks.push(NUM_TO_STR[v[1]])
            strBlocks.push(NUM_TO_STR[v[2]])
            strBlocks.push(NUM_TO_STR[v[3]])
        }
        let v = this._blockBytes(blockSize - 1)
        let rest = this._length - strBlocks.length * 8
        strBlocks.push(NUM_TO_STR[v[0]])
        if (rest > 8) {
            strBlocks.push(NUM_TO_STR[v[1]])
            if (rest > 16) {
                strBlocks.push(NUM_TO_STR[v[2]])
                if (rest > 24) {
                    strBlocks.push(NUM_TO_STR[v[3]])
                }
            }
        }
        if (rest % 8 != 0) {
            strBlocks[strBlocks.length - 1] = strBlocks[strBlocks.length - 1].substr(0, rest % 8)
        }
        return strBlocks.join('')
    }
}
module.exports = BitArray