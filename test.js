
a = [{c: '123'}, {d:'213'}]

b = [{c: '123', k:a}, {d:'213'}]

console.log(JSON.stringify(a) == JSON.stringify(b))