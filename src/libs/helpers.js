/**
 * Created by yetone on 14-10-13.
 */

function getIEDefineProperties() {
  //IE6-8使用VBScript类的set get语句实现. from 司徒正美
  window.execScript([
    "Function parseVB(code)",
    "\tExecuteGlobal(code)",
    "End Function",
    "Dim VBClassBodies",
    "Set VBClassBodies=CreateObject(\"Scripting.Dictionary\")",
    "Function findOrDefineVBClass(name,body)",
    "\tDim found",
    "\tfound=\"\"",
    "\tFor Each key in VBClassBodies",
    "\t\tIf body=VBClassBodies.Item(key) Then",
    "\t\t\tfound=key",
    "\t\t\tExit For",
    "\t\tEnd If",
    "\tnext",
    "\tIf found=\"\" Then",
    "\t\tparseVB(\"Class \" + name + body)",
    "\t\tVBClassBodies.Add name, body",
    "\t\tfound=name",
    "\tEnd If",
    "\tfindOrDefineVBClass=found",
    "End Function"
  ].join("\n"), "VBScript");

  function VBMediator(accessingProperties, name, value) {
    var accessor = accessingProperties[name];
    if (typeof accessor === "function") {
      if (arguments.length === 3) {
        accessor(value)
      } else {
        return accessor()
      }
    }
  }
  return function(name, accessors, properties) {
    var className = "VBClass" + setTimeout("1"),
      buffer = [];
    buffer.push(
      "\r\n\tPrivate [__data__], [__proxy__]",
      "\tPublic Default Function [__const__](d, p)",
      "\t\tSet [__data__] = d: set [__proxy__] = p",
      "\t\tSet [__const__] = Me", //链式调用
      "\tEnd Function");
    //添加普通属性,因为VBScript对象不能像JS那样随意增删属性，必须在这里预先定义好
    for (name in properties) {
      if (!accessors.hasOwnProperty(name)) {
        buffer.push("\tPublic [" + name + "]");
      }
    }
    buffer.push("\tPublic [" + 'hasOwnProperty' + "]");
    //添加访问器属性
    for (name in accessors) {
      buffer.push(
        //由于不知对方会传入什么,因此set, let都用上
          "\tPublic Property Let [" + name + "](val" + expose + ")", //setter
          "\t\tCall [__proxy__]([__data__], \"" + name + "\", val" + expose + ")",
        "\tEnd Property",
          "\tPublic Property Set [" + name + "](val" + expose + ")", //setter
          "\t\tCall [__proxy__]([__data__], \"" + name + "\", val" + expose + ")",
        "\tEnd Property",
          "\tPublic Property Get [" + name + "]", //getter
        "\tOn Error Resume Next", //必须优先使用set语句,否则它会误将数组当字符串返回
          "\t\tSet[" + name + "] = [__proxy__]([__data__],\"" + name + "\")",
        "\tIf Err.Number <> 0 Then",
          "\t\t[" + name + "] = [__proxy__]([__data__],\"" + name + "\")",
        "\tEnd If",
        "\tOn Error Goto 0",
        "\tEnd Property");

    }

    buffer.push("End Class");
    var code = buffer.join("\r\n"),
      realClassName = window['findOrDefineVBClass'](className, code); //如果该VB类已定义，返回类名。否则用className创建一个新类。
    if (realClassName === className) {
      window.parseVB([
          "Function " + className + "Factory(a, b)", //创建实例并传入两个关键的参数
        "\tDim o",
          "\tSet o = (New " + className + ")(a, b)",
          "\tSet " + className + "Factory = o",
        "End Function"
      ].join("\r\n"))
    }
    var ret = window[realClassName + "Factory"](accessors, VBMediator); //得到其产品
    return ret; //得到其产品
  }
}

module.exports = {
  getIEDefineProperties: getIEDefineProperties
};
