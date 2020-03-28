var mySet = new Set();

mySet.add(1);
mySet.add(5);
mySet.add("some text");
var o = {a: 1, b: 2};
mySet.add(o);

mySet.add({a: 1, b: 2}); // o đang reference đến một object khác => OK

mySet.has(1); // true
mySet.has(3); // false, 3 chưa được thêm vào trong set
mySet.has(5);              // true
mySet.has(Math.sqrt(25));  // true
mySet.has("Some Text".toLowerCase()); // true
mySet.has(o); // true

mySet.size; // 5

mySet.delete(5); // xóa 5 khỏi set
mySet.has(5);    // false, 5 đã được xóa

mySet.size; // 4, độ dài thay đổi do chúng ta mới xóa 1 item
