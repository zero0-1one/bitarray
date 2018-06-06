'use strict'

let BitArray = require('..')
let assert = require('assert')

function createBitArray(n) {
  let ba = new BitArray(n)
  for (let i = 0; i < ba.length; i += 3) {
    ba.set(i, 1)
  }
  return ba
}

describe('array', function () {

  describe('constructor', function () {
    it('int', function () {
      let ba = new BitArray(10)
      assert(ba.length == 10)
      ba.forEach(v => assert(v == 0))

      ba = new BitArray(101, 1)
      assert(ba.count() == ba.length)
      ba.forEach(v => assert(v == 1))
    })

    it('BitArray', function () {
      let ba = new BitArray(10)
      let ba2 = new BitArray(ba)
      assert(ba.length == 10)
      assert(ba2.length == 10)
      ba.set(5, 1)
      assert(ba2.get(5) == 0)
    })

    it('rawdata', function () {
      let data = {
        length: 100,
        rawdata: [1227133513, 2454267026, 613566756, 9]
      }
      let ba = new BitArray(data)
      assert(ba.length == 100);
      ba.forEach((v, i) => assert(v == (i % 3 == 0) ? 1 : 0));
    })


    it('Array', function () {
      let data = '1001001001001001001001001001001001001001001001001001001001001001'.split('')
      let ba = new BitArray(data)
      assert(ba.length == data.length)
      ba.forEach((v, i) => assert(v == (i % 3 == 0) ? 1 : 0))
    })

    it('string', function () {
      let data = '1001001001001001001001001001001001001001001001001001001001001001'
      let ba = new BitArray(data)
      assert(ba.length == data.length)
      ba.forEach((v, i) => assert(v == (i % 3 == 0) ? 1 : 0))
    })
  })


  it('count', function () {
    let ba = createBitArray(100)
    let count = 0
    for (let v of ba) {
      count += v
    }
    assert(count == ba.count())
  })


  it('set', function () {
    let ba = createBitArray(100)
    for (let i = 0; i < ba.length; i++) {
      assert(ba.get(i) == (i % 3 == 0) ? 1 : 0)
    }
  })

  it('get', function () {
    let ba = createBitArray(100)
    for (let i = 0; i < ba.length; i++) {
      assert(ba.get(i) == (i % 3 == 0) ? 1 : 0)
    }
  })

  it('not', function () {
    let ba = createBitArray(100)
    for (let i = 0; i < ba.length; i++) {
      ba.not(i)
    }
    for (let i = 0; i < ba.length; i++) {
      assert(ba.get(i) == (i % 3 == 0) ? 0 : 1)
    }
    ba.not()
    for (let i = 0; i < ba.length; i++) {
      assert(ba.get(i) == (i % 3 == 0) ? 1 : 0)
    }
    assert(ba.count() == 34)
  })


  it('and', function () {
    let ba1 = createBitArray(100)
    let ba2 = createBitArray(100)
    ba1.and(3, 0)
    ba1.and(25, 1)
    assert(ba1.count() == 33)

    ba1 = createBitArray(100)
    ba1.not()
    ba1.and(ba2)
    assert(ba1.count() == 0)
  })

  it('or', function () {
    let ba1 = createBitArray(100)
    let ba2 = createBitArray(100)
    ba1.or(3, 0)
    ba1.or(25, 1)
    assert(ba1.count() == 35)

    ba1 = createBitArray(100)
    ba1.not()
    ba1.or(ba2)
    assert(ba1.count() == ba1.length)
  })

  it('xor', function () {
    let ba1 = createBitArray(100)
    let ba2 = new BitArray(1000)
    ba1.xor(3, 0)
    ba1.xor(25, 1)
    ba1.xor(30, 1)
    assert(ba1.count() == 34)

    ba1 = createBitArray(100)
    ba2.fill(0)
    ba1.xor(ba2)
    assert(ba1.equal(createBitArray(100)))

    ba2.fill(1)
    ba1.xor(ba2)
    assert(ba1.equal(createBitArray(100).not()))
  })

  it('equal', function () {
    let ba1 = createBitArray(100)
    let ba2 = createBitArray(100)
    assert(ba1.equal(ba2))

    ba2.not(13)
    assert(!ba1.equal(ba2))
  })

  it('fill', function () {
    let ba = new BitArray(113)
    ba.fill(1)
    assert(ba.count() == ba.length)
    ba.forEach(v => assert(v == 1))

    ba.fill(0, 50)
    assert(ba.count() == 50)
    ba.forEach((v, i) => assert((i >= 50 && v == 0) || (i < 50 && v == 1), i))

    ba.fill(0)
    ba.fill(1, 85, 85)
    ba.fill(1, -5, -2)
    assert(ba.count() == 5 - 2)

    ba.fill(1)
    ba.fill(0, 27, 30)
    assert(ba.count() == ba.length - (30 - 27))

    ba.fill(0)
    ba.fill(1, 27, 30)
    assert(ba.count() == 30 - 27)
  })

  it('cover', function () {
    let ba1 = new BitArray(100)
    let ba2 = new BitArray(100)

    ba1.fill(1)
    ba1.cover(ba2, -80, -70)
    assert(ba1.count() == ba1.length - (80 - 70))

    ba1.fill(1)
    ba1.cover(ba2, 77, 77)
    ba1.cover(ba2, 27, 30)
    assert(ba1.count() == ba1.length - (30 - 27))


    ba1.fill(0)
    ba2.fill(1, 10, 65)
    ba1.cover(ba2, 55)
    assert(ba1.count() == 65 - 55)
  })



  it('swap', function () {
    let ba1 = new BitArray(100)
    let ba2 = new BitArray(100)

    ba1.fill(1)
    ba1.swap(ba2, 2, 78)
    assert(ba1.count() == ba1.length - (78 - 2))
    assert(ba2.count() == 78 - 2)


    ba1.fill(0)
    ba2.fill(0)
    ba2.fill(1, 10, 65)
    ba1.swap(ba2, 55)
    assert(ba1.count() == 65 - 55)
    assert(ba2.count() == 55 - 10)

    ba1.fill(0)
    ba2.fill(1)
    ba1.swap(ba2, 0, 0)
    ba1.swap(ba2, -30, -27)
    assert(ba1.count() == 30 - 27)
    assert(ba2.count() == ba1.length - (30 - 27))

    ba1.fill(0)
    ba2.fill(1)
    ba1.swap(ba2, 27, 30)
    assert(ba1.count() == 30 - 27)
    assert(ba2.count() == ba1.length - (30 - 27))
  })

  it('iterator', function () {
    let ba = createBitArray(100)
    let count = 0
    for (let v of ba) {
      count += v
    }
    assert(count == 34)
  })


  it('entries', function () {
    let ba = createBitArray(100)
    let entries = ba.entries()
    let count = 0
    for (let [i, v] of entries) {
      count += v
      assert(v == (i % 3 == 0) ? 1 : 0)
    }
    assert(count == 34)
  })

  it('forEach', function () {
    let ba = createBitArray(100)
    ba.forEach((v, i) => assert(v == (i % 3 == 0) ? 1 : 0))
  })

  it('forExist', function () {
    let ba = createBitArray(100)
    let count = 0
    ba.forExist(i => {
      assert(i % 3 == 0)
      count++
    })
    assert(count == ba.count())
  })


  it('toArray', function () {
    let ba = createBitArray(100)
    let ba2 = new BitArray(ba.toArray())
    assert(ba.equal(ba2))
  })

  it('rawData', function () {
    let ba = createBitArray(100)
    let ba2 = new BitArray(ba.rawData())
    assert(ba.equal(ba2))
  })

  it('compactData', function () {
    let ba = createBitArray(100)
    let ba2 = new BitArray(ba.compactData())
    assert(ba.equal(ba2))
  })
  
  it('toString', function () {
    let ba = createBitArray(100)
    let ba2 = new BitArray(ba.toString())
    assert(ba.equal(ba2))
  })

  it('usage', function () {
    let ba = new BitArray('1010101010')
    assert(ba.get(0) == 1)
    assert(ba.count() == 5)

    assert(ba.get(1) == 0)
    ba.set(1, 1)
    assert(ba.get(1) == 1)
    ba.not(1)

    let s = ''
    for (let v of ba) {
      s += v
    }
    assert(s == '1010101010')

    s = ''
    ba.forEach((v, i) => {
      s += v
    })
    assert(s == '1010101010')

    s = ''
    ba.forExist(i => {
      s += i
    })
    assert(s == '02468')

    assert(String(ba) == '1010101010')

  })
})
