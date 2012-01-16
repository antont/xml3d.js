new (function() {

    /**
     * Creates an instance of XML3DRotation. XML3DRotation represents a
     * three-dimensional vector as a 3-tuple floating point values.
     * @constructor
     * @this {XML3DRotation}
     * @param {number=} x The x value (optional). Default: 0.
     * @param {number=} y The y value (optional). Default: 0.
     * @param {number=} z The z value (optional). Default: 0.
     * @param {function(XML3DVec3=)=} cb Called, if value has changed.
     *                                   Has this as first parameter.
     */
    var XML3DRotation = function(axis, angle, cb) {
        var that = this;

        /** @private **/
        this._callback = typeof cb == 'function' ? cb : 0;

        /** @private */
        var vec_cb = function() { if(that._callback) that._callback(that); };
        this._axis = axis ? new XML3DVec3(axis.x, axis.y, axis.z, vec_cb)
                : new XML3DVec3(0, 0, 1, vec_cb);
        /** @private */
        this._angle = angle || 0;

    }, p = XML3DRotation.prototype;

    /** @type {number} */
    Object.defineProperty(p, "axis", {
        /** @this {XML3DRotation} * */
        get : function() {
            return this._axis;
        },
        set : function() {
            throw Error("Can't set axis. XML3DRotation::axis is readonly.");
        },
        configurable : false,
        enumerable : false
    });

    /** @type {number} */
    Object.defineProperty(p, "angle", {
        /** @this {XML3DRotation} * */
        get : function() {
            return this._angle;
        },
        set : function(angle) {
            this._angle = angle;
            if (this._callback)
                this._callback(this);
    },
    configurable : false,
    enumerable : false
    });

    /**
     * String representation of the XML3DRotation.
     * @override
     * @this {XML3DRotation}
     * @return {string} Human-readable representation of this XML3DRotation.
     */
    p.toString = function() {
        return "XML3DRotation(" + this._axis + ", " + this._angle + ")";
    };

    /**
     * Replaces the existing rotation with the axis-angle representation passed
     * as argument
     */
    p.setAxisAngle = function(axis, angle) {
        if (typeof axis != 'object' || isNaN(angle)) {
            throw new Error("Illegal axis and/or angle values: " + "( axis="
                    + axis + " angle=" + angle + " )");
        }

        // TODO: slice?
        this._axis._data[0] = axis._data[0];
        this._axis._data[1] = axis._data[1];
        this._axis._data[2] = axis._data[2];
        this._angle = angle;
        if (this._callback)
            this._callback(this);
    };

    /**
     * Replaces the existing rotation with one computed from the two vectors
     * passed as arguments. {XML3DVec} from First vector {XML3DVec} from Second
     * vector
     */
    p.setRotation = function(from, to) {
        var a = from.normalize();
        var b = to.normalize();

        // This function will also callback
        this.setAxisAngle(from.cross(to), Math.acos(a.dot(b)));
    };

    /**
     * Replaces the existing matrix with one computed from parsing the passed
     * string.
     * @param str String to parse
     */
    p.setAxisAngleValue = function(str) {
        var m = /^\s*(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s*$/.exec(str);
        if (!m)
            throw new Error("Could not parse AxisAngle string: " + str);

        // This function will also callback
        this.setAxisAngle(new XML3DVec3(+m[1], +m[2], +m[3]), +m[4]);
    };

    /**
     * Linear interpolation of this rotation rot0 with the passed rotation rot1
     * with factor t. The result is (1-t)rot0 + t rot1. Typically realized with
     * a spherical linear interpolation based on quaternions.
     * @param {XML3DRotation} rot1 the passed rotation
     * @param {number} t the factor
     */
    p.interpolate = function(rot1, t) {
        var dest = quat4.create(), result = new XML3DRotation();
        quat4.slerp(p.toQuaternion(this), p.toQuaternion(rot1), t, dest);
        result._setQuaternion(dest);
        return result;
    };

    p.toQuaternion = function(aa) {
        var l = aa._axis.length();
        if (l > 0.00001) {
            var s = Math.sin(aa._angle / 2) / l;
            var w = Math.cos(aa._angle / 2);
            var a = aa._axis.scale(s);
            return quat4.create( [ a.x, a.y, a.z, w ]);
        } else {
            return quat4.create( [ 0, 0, 0, 1 ]);
        }
    };

    /**
     * Replaces the existing rotation with the quaternion representation passed
     * as argument
     * @param {XML3DVec3} vector
     * @param {number} w
     */
    p.setQuaternion = function(vector, scalar) {
        this._setQuaternion( [ vector.x, vector.y, vector.z, scalar ]);
    };

    /**
     * Returns a XML3DMatrix that describes this 3D rotation in a 
     * 4x4 matrix representation.
     * @return {XML3DMatrix} Rotation matrix
     */
    p.toMatrix = function() {
      var m = new XML3DMatrix();
      quat4.toMat4(p.toQuaternion(this),m._data);
      return m;
    };
    
    /**
     * Rotates the vector passed as parameter with this rotation 
     * representation. The result is returned as new vector instance.
     * Neither this nor the inputVector are changed.
     * 4x4 matrix representation.
     * @param {XML3DVec3} inputVector 
     * @return {XML3DVec3} The rotated vector
     */
    p.rotateVec3 = function(inputVector) {
        var dest = vec3.create(), result = new XML3DVec3();
        quat4.multiplyVec3(p.toQuaternion(this), inputVector._data, result._data);
        return result;
    };
    
    /**
     * Replaces the existing rotation with the quaternion representation passed
     * as argument
     * @private
     * @param {Array} quat
     */
    p._setQuaternion = function(quat) {
        var s = Math.sqrt(1 - quat[3] * quat[3]);
        if (s < 0.001 || isNaN(s)) {
            this._axis._data[0] = 0;
            this._axis._data[1] = 0;
            this._axis._data[2] = 1;
            this._angle = 0;
        } else {
            s = 1 / s;
            this._axis._data[0] = quat[0] * s;
            this._axis._data[1] = quat[1] * s;
            this._axis._data[2] = quat[2] * s;
            this._angle = 2 * Math.acos(quat[3]);
        }
        if (this._callback)
            this._callback(this);
    };

    /**
     * Multiplies this rotation with the passed rotation. This rotation is not
     * changed.
     * 
     * @param {XML3DRotation} rot1
     * @return {XML3DVec3} The result
     */
    p.multiply = function(rot1) {
        var result = new XML3DRotation(), q = quat4.create();
        quat4.multiply(p.toQuaternion(this), p.toQuaternion(rot1), q);
        result._setQuaternion(q);
        return result;
    };

    /**
     * Returns the normalized version of this rotation. Result is a newly
     * created vector. This is not modified.
     */
    p.normalize = function(that) {
        var na = this._axis.normalize();
        return new XML3DRotation(na, this._angle);
    };

    org.xml3d.XML3DRotation = XML3DRotation;
    if (!window.XML3DRotation)
        window.XML3DRotation = XML3DRotation;

})();
