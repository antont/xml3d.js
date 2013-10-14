(function(){

/**
 * @constructor
 * @param {Xflow.DataNode} dataNode
 * @param {Array.<string>} filter
 */
var Request = function(dataNode, filter, callback){
    this._dataNode = dataNode;
    this._filter = filter ? filter.slice().sort() : null;
    this._listener = callback;
    this._result = null;
    this._dataNodeListener = this._onDataNodeChange.bind(this);
    this._dataNode.addListener(this._dataNodeListener);
};
Xflow.Request = Request;

Object.defineProperty(Request.prototype, "dataNode", {
    set: function(v){
       throw new Error("dataNode is readonly");
    },
    get: function(){ return this._dataNode; }
});

Object.defineProperty(Request.prototype, "filter", {
    set: function(v){
        throw new Error("filter is read-only");
    },
    get: function(){ return this._filter; }
});

/**
 * Call this function, whenever the request is not required anymore.
 */
Request.prototype.clear = function(){
    this._listener = null;
    if(this._result) this._result._removeRequest(this);
    this._dataNode.removeListener(this._dataNodeListener);
};

Request.prototype._onListedCallback = function(data){
    this._listener && this._listener(this, data)
};

function swapResultRequest(request, newResult){
    if(request._result) request._result._removeRequest(request);
    request._result = newResult
    if(newResult) newResult._addRequest(request);
    return newResult;
}

/**
 * @param {Xflow.Request} request
 * @param {Xflow.RESULT_STATE} notification
 */
function notifyListeners(request, notification){
    Xflow._listCallback(request, notification);
};

/**
 * @param {Xflow.RESULT_STATE} notification
 */
Request.prototype._onDataNodeChange = function(notification){
    notifyListeners(this, notification);
}

/**
 * @constructor
 * @extends {Xflow.Request}
 * @param {Xflow.DataNode} dataNode
 * @param {Array.<string>} filter
 * @param {function} callback
 */
var ComputeRequest = function(dataNode, filter, callback){
    Xflow.Request.call(this, dataNode, filter, callback);
};
Xflow.createClass(ComputeRequest, Xflow.Request);
Xflow.ComputeRequest = ComputeRequest;

ComputeRequest.prototype.getResult = function(){
    return swapResultRequest(this, this._dataNode._getResult(Xflow.RESULT_TYPE.COMPUTE, this._filter));
}

ComputeRequest.prototype._onResultChanged = function(notification){
    this._onDataNodeChange(notification);
}


var c_vsConnectNodeCount = {},
    c_vsConnectNodeCache = {};

/**
 * @constructor
 * @extends {Xflow.Request}
 * @param {Xflow.DataNode} dataNode
 * @param {Xflow.VSConfig} vsConfig
 */
var VertexShaderRequest = function(dataNode, vsConfig, callback){

    var filter = vsConfig.getFilter();
    if(filter.length == 0)
        throw new Error("vsConfig requires at least one attribute entry.");
    Xflow.Request.call(this, dataNode, filter, callback);
    this._vsConfig = vsConfig;
    this._vsConnectNode = getVsConnectNode(dataNode, vsConfig);
};
Xflow.createClass(VertexShaderRequest, Xflow.Request);
Xflow.VertexShaderRequest = VertexShaderRequest;

VertexShaderRequest.prototype.getResult = function(){
    return swapResultRequest(this, this._vsConnectNode._getResult(Xflow.RESULT_TYPE.VS, this._filter));
}

VertexShaderRequest.prototype._onDataNodeChange = function(notification){
    if(notification == Xflow.RESULT_STATE.CHANGED_STRUCTURE){
        var newVSConnectedNode = getVsConnectNode(this._dataNode, this._vsConfig);
        if(newVSConnectedNode != this._vsConnectNode){
            clearVsConnectNode(this._vsConnectNode, this._dataNode, this._vsConfig);
            this._vsConnectNode = newVSConnectedNode;
        }
    }
    Request.prototype._onDataNodeChange.call(this, notification);
}

VertexShaderRequest.prototype._onResultChanged = function(result, notification){
    this._onDataNodeChange(notification);
}

function getVsConnectNode(dataNode, vsConfig){
    var forwardNode = dataNode._getForwardNode();

    var key = getDataNodeShaderKey(dataNode, vsConfig);
    var connectNode;
    if(!(connectNode = c_vsConnectNodeCache[key])){
        var graph = dataNode._graph;
        connectNode = graph.createDataNode(false);
        connectNode.appendChild(dataNode);

        var operator = vsConfig.getOperator();
        connectNode.computeOperator = operator;
        connectNode._computeInputMapping = new Xflow.OrderMapping(connectNode);
        connectNode._computeOutputMapping = new Xflow.OrderMapping(connectNode);
        vsConfig.setInputMapping(connectNode._computeInputMapping);
        vsConfig.setOutputMapping(connectNode._computeOutputMapping);

        c_vsConnectNodeCache[key] = connectNode;
        c_vsConnectNodeCount[connectNode.id] = 1;
    }
    else{
        c_vsConnectNodeCount[connectNode.id]++;
    }

    return connectNode;
}

function clearVsConnectNode(connectNode, dataNode, vsConfig){
    c_vsConnectNodeCount[connectNode.id]--;
    if(!c_vsConnectNodeCount[connectNode.id]){
        var key = getDataNodeShaderKey(dataNode, vsConfig);
        c_vsConnectNodeCache[key] = null;
        connectNode.clearChildren();
    }
}


function getDataNodeShaderKey(dataNode, vsConfig){
    return dataNode.id + "|" + vsConfig.getKey();
}

})();
