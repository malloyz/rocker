/**
 * Created by malloyzhu on 2016/2/2.
 */


var TouchType = {
    DEFAULT: "DEFAULT",
    FOLLOW: "FOLLOW"
};

var DirectionType = {
    FOUR: "FOUR",
    EIGHT: "EIGHT",
    ALL: "ALL"
};

var TouchType = {
    DEFAULT: "DEFAULT",
    FOLLOW: "FOLLOW"
};

var DirectionType = {
    FOUR: "FOUR",
    EIGHT: "EIGHT",
    ALL: "ALL"
};

var Rocker = cc.Node.extend({
    _rockerControl: null,       //控杆
    _rockerBg: null,     //控杆背景
    _listener: null,    //监听器
    _radius: 0,         //半径
    _angle: null,       //角度
    _radian: null,      //弧度
    _speed: 0,          //实际速度
    _speed1: 1,         //一段速度
    _speed2: 2,         //二段速度
    _touchType: null,   //触摸类型
    _directionType: null,   //方向类型
    _opacity: 0,        //透明度
    _callback: null,

    ctor: function (rockerBg, rockerControl, radius, touchType, directionType) {
        this._super();
        this._touchType = touchType;
        this._directionType = directionType;
        this._radius = radius;

        this.setAnchorPoint(0.5, 0.5);
        this.setVisible(!(this._touchType == TouchType.FOLLOW));

        //创建摇杆精灵
        this._createStickSprite(rockerBg, rockerControl, radius);

        //初始化触摸事件
        this._initTouchEvent();
    },

    setCallBack: function (fun) {
        this._callback = fun;
    },

    _createStickSprite: function (rockerBg, rockerControl, radius) {

        //摇杆背景精灵
        this._rockerBg = new cc.Sprite(rockerBg);
        this._rockerBg.setPosition(radius, radius);
        this.addChild(this._rockerBg);

        //摇杆精灵
        this._rockerControl = new cc.Sprite(rockerControl);
        this._rockerControl.setPosition(radius, radius);
        this.addChild(this._rockerControl);

        //根据半径设置缩放比例
        var scale = radius / (this._rockerBg.getContentSize().width / 2);
        this._rockerBg.setScale(scale);
        this._rockerControl.setScale(scale);

        //设置大小
        this.setContentSize(this._rockerBg.getBoundingBox());
    },

    _initTouchEvent: function () {
        this._listener = cc.EventListener.create({
            event: cc.EventListener.TOUCH_ONE_BY_ONE,
            swallowTouches: false,
            onTouchBegan: this._onTouchBegan.bind(this),
            onTouchMoved: this._onTouchMoved.bind(this),
            onTouchEnded: this._onTouchEnded.bind(this)
        });
    },

    //计算角度并返回
    _getAngle: function (point) {
        var pos = this._rockerBg.getPosition();
        this._angle = Math.atan2(point.y - pos.y, point.x - pos.x) * (180 / cc.PI);
        return this._angle;
    },

    //计算弧度并返回
    _getRadian: function (point) {
        this._radian = cc.PI / 180 * this._getAngle(point);
        return this._radian;
    },

    //计算两点间的距离并返回
    _getDistanceSquare: function (pos1, pos2) {
        return Math.pow(pos1.x - pos2.x, 2) +
            Math.pow(pos1.y - pos2.y, 2);
    },

    _onTouchBegan: function (touch, event) {
        //触摸监听目标
        var target = event.getCurrentTarget();

        //如果触摸类型为FOLLOW，则摇控杆的位置为触摸位置,触摸开始时候现形
        var location = touch.getLocation();
        if (this._touchType == TouchType.FOLLOW) {
            this.setPosition(location);
            this.setVisible(true);
            this.scheduleUpdate();
            return true;
        } else {
            //把触摸点坐标转换为相对与目标的模型坐标
            var touchPos = this.convertToNodeSpace(location);

            //点与圆心的距离
            var distanceSquare = this._getDistanceSquare(touchPos, target);

            //圆的半径
            var radius = target.getBoundingBox().width / 2;

            //如果点与圆心距离小于圆的半径,返回true
            if (radius * radius > distanceSquare) {
                this._rockerControl.setPosition(touchPos);
                this.scheduleUpdate();
                return true;
            }
        }
        return false;
    },

    _onTouchMoved: function (touch, event) {
        //触摸监听目标
        var target = event.getCurrentTarget();

        //把触摸点坐标转换为相对与目标的模型坐标
        var touchPos = this.convertToNodeSpace(touch.getLocation());

        //点与圆心的距离
        var distanceSquare = this._getDistanceSquare(touchPos, target);

        //圆的半径
        var radius = target.getBoundingBox().width / 2;

        //如果点与圆心距离小于圆的半径,控杆跟随触摸点
        if (radius * radius > distanceSquare) {
            this._rockerControl.setPosition(touchPos);
        }
        else {
            var x = target.getPositionX() + Math.cos(this._getRadian(touchPos)) * this._radius;
            var y = target.getPositionY() + Math.sin(this._getRadian(touchPos)) * this._radius;
            this._rockerControl.setPosition(x, y);
        }

        //更新角度
        this._getAngle(touchPos);

        //设置实际速度
        this._setSpeed(touchPos);
    },

    _onTouchEnded: function (touch, event) {
        //触摸监听目标
        var target = event.getCurrentTarget();

        //如果触摸类型为FOLLOW，离开触摸后隐藏
        this.setVisible(!(this._touchType == TouchType.FOLLOW));

        //摇杆恢复位置
        var distance = Math.sqrt(this._getDistanceSquare(target.getPosition(), this._rockerControl.getPosition()));
        var moveAction = new cc.MoveTo(distance / 500, target.getPosition());
        var action = new cc.EaseElasticOut(moveAction, 0.6);
        this._rockerControl.stopAllActions();
        this._rockerControl.runAction(action);

        this.unscheduleUpdate();
    },

    //设置实际速度
    _setSpeed: function (point) {
        //触摸点和遥控杆中心的距离
        var distanceSquare = this._getDistanceSquare(point, this._rockerBg.getPosition());

        //如果半径
        if (distanceSquare < this._radius * this._radius) {
            this._speed = this._speed1;
        } else {
            this._speed = this._speed2;
        }
    },

    //更新移动目标
    update: function (dt) {
        switch (this._directionType) {
            case DirectionType.FOUR:
                this._fourDirectionsMove();
                break;
            case DirectionType.EIGHT:
                this._eightDirectionsMove();
                break;
            case DirectionType.ALL:
                this._allDirectionsMove();
                break;
            default :
                break;
        }
    },

    _updateCallBack: function (incrementX, incrementY) {
        if (typeof this._callback === 'function') {
            this._callback(incrementX, incrementY);
        }
    },

    //四个方向移动(上下左右)
    _fourDirectionsMove: function () {
        var incrementX = 0;
        var incrementY = 0;
        if (this._angle > 45 && this._angle < 135) {
            incrementY = this._speed;
        } else if (this._angle > -135 && this._angle < -45) {
            incrementY = -this._speed;
        } else if (this._angle < -135 && this._angle > -180 || this._angle > 135 && this._angle < 180) {
            incrementX = -this._speed;
        } else if (this._angle < 0 && this._angle > -45 || this._angle > 0 && this._angle < 45) {
            incrementX = this._speed;
        }
        this._updateCallBack(incrementX, incrementY);
    },

    //八个方向移动(上下左右、左上、右上、左下、右下)
    _eightDirectionsMove: function () {
        var incrementX = 0;
        var incrementY = 0;
        if (this._angle > 67.5 && this._angle < 112.5) {
            incrementY = this._speed;
        } else if (this._angle > -112.5 && this._angle < -67.5) {
            incrementY = -this._speed;
        } else if (this._angle < -157.5 && this._angle > -180 || this._angle > 157.5 && this._angle < 180) {
            incrementX = -this._speed;
        } else if (this._angle < 0 && this._angle > -22.5 || this._angle > 0 && this._angle < 22.5) {
            incrementX = this._speed;
        } else if (this._angle > 112.5 && this._angle < 157.5) {
            incrementX = -this._speed / 1.414;
            incrementY = this._speed / 1.414;
        } else if (this._angle > 22.5 && this._angle < 67.5) {
            incrementX = this._speed / 1.414;
            incrementY = this._speed / 1.414;
        } else if (this._angle > -157.5 && this._angle < -112.5) {
            incrementX = -this._speed / 1.414;
            incrementY = -this._speed / 1.414;
        } else if (this._angle > -67.5 && this._angle < -22.5) {
            incrementX = this._speed / 1.414;
            incrementY = -this._speed / 1.414;
        }
        this._updateCallBack(incrementX, incrementY);
    },

    //全方向移动
    _allDirectionsMove: function () {
        var incrementX = Math.cos(this._angle * (Math.PI / 180)) * this._speed;
        var incrementY = Math.sin(this._angle * (Math.PI / 180)) * this._speed;
        this._updateCallBack(incrementX, incrementY);
    },

    //设置透明度
    setOpacity: function (opacity) {
        this._super(opacity);
        this._rockerControl.setOpacity(opacity);
        this._rockerBg.setOpacity(opacity);
    },

    //设置一段速度
    setSpeedWithLevel1: function (speed) {
        this._speed1 = speed;
    },

    //设置二段速度
    setSpeedWithLevel2: function (speed) {
        if (this._speed1 < speed) {
            this._speed2 = speed;
        } else {
            this._speed2 = this._speed2;
        }
    },

    //设置遥控杆开关
    setEnable: function (enable) {
        if (this._listener != null) {
            if (enable) {
                cc.eventManager.addListener(this._listener, this._rockerBg);
            } else {
                cc.eventManager.removeListener(this._listener);
            }
        }
    },

    //获取角度
    getAngle: function () {
        return this._angle;
    },

    onExit: function () {
        this._super();
        //移除触摸监听
        if (this._listener != null) {
            cc.eventManager.removeListener(this._listener);
        }
    }
});
