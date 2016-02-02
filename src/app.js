
var HelloWorldLayer = cc.Layer.extend({
    _sprite:null,

    ctor:function () {
        this._super();

        var rocker = new Rocker(res.rockerBg_png, res.rockerControl_png, 50, TouchType.DEFAULT, DirectionType.ALL);
        rocker.setPosition(300, 300);
        rocker.setSpeedWithLevel1(1);
        rocker.setSpeedWithLevel2(1);
        rocker.setEnable(true);
        rocker.setCallBack(this._onOperateRocker.bind(this));
        this.addChild(rocker);

        this._sprite = new cc.Sprite(res.CloseNormal_png);
        this._sprite.setPosition(cc.winSize.width / 2, cc.winSize.height / 2);
        this.addChild(this._sprite);

        return true;
    },

    _onOperateRocker: function (incrementX, incrementY) {
        this._sprite.setPosition(this._sprite.getPositionX() + incrementX, this._sprite.getPositionY() + incrementY);
    }
});

var HelloWorldScene = cc.Scene.extend({
    onEnter:function () {
        this._super();
        var layer = new HelloWorldLayer();
        this.addChild(layer);
    }
});

