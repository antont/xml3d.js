module("Element interface tests", {
});

test("Event attribute tests", function() {
    var e = document.createElementNS(org.xml3d.xml3dNS, "xml3d");
    var getterText =  "alert('get function')";
    
    // Set via attribute and get via interface
    equals(e.onclick, null, "xml3d::onclick is null initially.");
    e.setAttribute("onclick", getterText);
    equals(e.getAttribute("onclick"), getterText, "Value set.");
    equals(typeof e.onclick, "function", "onclick is of type function");
    equals(e.onclick.toString(), "function onclick(event){\n  alert('get function')\n}", "text");
    
    // Set via interface
    var v = function() { console.log("set function"); };
    e.onclick = v;
    equals(e.getAttribute("onclick"), getterText, "Value of attribute remains unchanged after setting event function per interface.");
    equals(e.onclick, v, "Function is set.");
    
    e.setAttribute("onclick", getterText);
    notEqual(e.onclick, v, "Setting of attribute changed function.");
});

test("Int interface tests", function() {
    var e = document.createElementNS(org.xml3d.xml3dNS, "xml3d");
    
    // Set via interface
    equals(e.width, 800, "xml3d.width is 800 initially.");
    e.width = 300;
    equals(e.width, 300, "xml3d.width = 300.");
    equals(e.getAttribute("width"), "300", "getAttribute = '300'.");
    e.width = true;
    equals(e.width, 1, "xml3d.width = 1.");
    e.width = 500.9;
    equals(e.width, 500, "xml3d.width = 500.9.");
    

    // Set via attribute
    e.setAttribute("width", "123");
    equals(e.width, 123, "Value set via setAttribute to 123.");

    e.setAttribute("width", "100.9");
    equals(e.width, 100, "Value set via setAttribute to 100.9.");

    e.setAttribute("width", "asdf");
    equals(e.width, 800, "Invalid value set via setAttribute. Back to default: 800.");
});

test("Float interface tests", function() {
    var e = document.createElementNS(org.xml3d.xml3dNS, "view");
    
    // Set via interface
    equals(e.fieldOfView, 0.785398, "view.fieldOfView is 0.785398 initially.");
    e.fieldOfView = 0.87;
    equals(e.fieldOfView, 0.87, "view.fieldOfView = 0.87.");
    equals(e.getAttribute("fieldOfView"), "0.87", "getAttribute = '0.87'.");
    e.fieldOfView = true;
    equals(e.fieldOfView, 1, "view.fieldOfView = 1.");
    

    // Set via attribute
    e.setAttribute("fieldOfView", "0.5");
    equals(e.fieldOfView, 0.5, "Value set via setAttribute to 0.5.");

    e.setAttribute("fieldOfView", "asdf");
    equals(e.fieldOfView, 0.785398, "Invalid value set via setAttribute. Back to default: 0.785398.");
});

test("Boolean interface tests", function() {
    var e = document.createElementNS(org.xml3d.xml3dNS, "view");
    
    // Set via interface
    equals(e.visible, true, "view.fieldOfView is 'true' initially.");
    e.visible = false;
    equals(e.visible, false, "view.visible = false;");
    e.visible = true;
    equals(e.visible, true, "view.visible = true;");
    e.visible = 0;
    equals(e.visible, false, "view.visible = true;");
    e.visible = "false"; // Non-empty string evaulates to 'true'
    equals(e.visible, true, "view.visible = 'false';");

    e.visible = true;
    equals(e.getAttribute("visible"), "true", "getAttribute = 'true'.");
    e.visible = true;
    equals(e.getAttribute("visible"), "true", "getAttribute = 'true'.");

    // Set via attribute
    e.visible = false;
    e.setAttribute("visible", "true");
    equals(e.visible, true, "Value set via setAttribute to 'true'.");

    e.setAttribute("visible", "asdf");
    equals(e.visible, 0.785398, "Invalid value set via setAttribute. Back to default: 0.785398.");
});