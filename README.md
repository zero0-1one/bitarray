# bitarray
Memory efficient Boolean array implementation, very easy to use

# Installation
```sh
  npm install  zo-bitarray --save
```

# Usage
```js
    const BitArray = require('zo-bitarray')  

    let ba = new BitArray('1010101010')
    ba.get(0)  //1
    ba.count() //5
    ba.set(3, 1) // ba.get(3) -> 1
    ba.not(3)   // ba.get(3) -> 0

    for(let v of ba){
     //v is assigned to  1,0,1,0,1,0,1,0,1,0  in order
    }
    
    ba.forExist(i => {
      ba.get(i) // always 1
    })
```

# API
##  Constructor
- constructor(lenght, val=0)
- constructor(data)
```js
  new BitArray(10)  //0000000000
  new BitArray(10, 1) //1111111111
  new BitArray([1,0,1,0,1,0,1,0,1,0]) // 1010101010
  let ba = new BitArray('1010101010') // 1010101010
  new BitArray(ba) // 1010101010

  let data = {  //Usually get from  BitArray.rawData()
    length: 100,
    rawdata: [1227133513, 2454267026, 613566756, 9]
  }
  let ba = new BitArray(data) // 100100100.....100   100 bits  
```
## Attribute
- length
- count()
- blockSize()
- blockBitNum()

## Traversing Data
- for of
- forEach(cb)
- forExist(cb)
- entries()
```js
  let ba = new BitArray('1010101010')
  let s = ''
  for(let v of ba){
    s += v
  }  // s == '1010101010'

  s = ''
  ba.forEach((v, i) => {
    s += v
  })  // s == '1010101010'

  s = ''
  ba.forExist(i => {
    s += i
  }) // s == '02468'

  s = ''
  for (let [i, v] of ba.entries()) {
    s += i + ':' + v + ','
  } // s == '0:1,1:0,2:1,3:0,4:1,5:0,6:1,7:0,8:1,9:0,'

  assert(String(ba) == '1010101010')
```

## Export Data
- toString()
- toArray()
- rawData()
```js
  let ba = new BitArray('1010101010') 
  ba.toString() //'1010101010'
  ba.toArray() // [1,0,1,0,1,0,1,0,1,0]

  //More compact data
  ba.rawData() //{length:10,rawdata:[341]}
```
##  Bit Operation
- `get`(index)
- `set`(index, val)
- `and`(other)
- `and`(index, val)
- `or`(other)
- `or`(index, val)
- `not`(index)
- `not`() 
- `xor`(index, val)
- `xor`(other)

## Other
- `fill`(val, begin, end)
- `cover`(other, begin, end)
- `swap`(other, begin, end)