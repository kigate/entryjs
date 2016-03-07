/*
 */
"use strict";

goog.provide("Entry.FieldOutput");

goog.require("Entry.Field");
/*
 *
 */
Entry.FieldOutput = function(content, blockView, index) {
    this._blockView = blockView;
    this._block = blockView.block;
    this._valueBlock = null;

    var box = new Entry.BoxModel();
    this.box = box;

    this._index = index;
    this._content = content;
    this.dummyBlock = null;

    this.acceptType = content.accept;

    this.svgGroup = null;

    this._position = content.position;

    this.box.observe(blockView, "alignContent", ["width", "height"]);

    this.renderStart(blockView.getBoard());
    this._block.observe(this, "_updateThread", ["thread"]);
};

Entry.Utils.inherit(Entry.Field, Entry.FieldOutput);

(function(p) {
    p.renderStart = function(board) {
        this.svgGroup = this._blockView.contentSvgGroup.group();
        this.box.set({
            width: - Entry.BlockView.PARAM_SPACE,
            height: 0
        });
        this._thread = this.getValue();
        this.dummyBlock = new Entry.OutputDummyBlock(this, this._blockView);
        this._thread.insertDummyBlock(this.dummyBlock);
        this._inspectThread();
        this._thread.createView(board);

        this.dummyBlock.observe(this, "_inspectThread", ["next"]);
        this.dummyBlock.observe(this, "calcWH", ["next"]);
        this.calcWH();
    };

    p.align = function(x, y, animate) {
        animate = animate === undefined ? true : animate;
        var svgGroup = this.svgGroup;
        if (this._position) {
            if (this._position.x)
                x = this._position.x;
            if (this._position.y)
                y = this._position.y;
        }

        x -= 2;

        var block = this._thread.getFirstBlock();
        if (block.isDummy)
            block = block.next;

        if (block) {
            y = block.view.height * -0.5;
        }
        var transform = "t" + x + " " + y;

        if (block != this._valueBlock) {
            if (this._valueBlock)
                this._valueBlock.view.set({shadow:true});

            this._valueBlock = block;
            if (this._valueBlockObserver) this._valueBlockObserver.destroy();
            if (this._valueBlock) {
                var blockView = this._valueBlock.view;
                this._valueBlockObserver =
                    blockView.observe(this, "calcWH", ["width", "height"]);

                if (blockView.shadow) blockView.set({shadow:false});
            }
        }

        if (animate)
            svgGroup.animate({
                transform: transform
            }, 300, mina.easeinout);
        else
            svgGroup.attr({
                transform: transform
            });
    };

    p.calcWH = function() {
        var block = this._thread.getFirstBlock();
        if (block.isDummy) block = block.next;

        if (block) {
            var blockView = block.view;
            this.outputWidth = blockView.width;
        }

        this._blockView.alignContent();
    };

    p.calcHeight = p.calcWH;

    p._updateThread = function() {
        if (this._threadChangeEvent)
            this._thread.changeEvent.detach(this._threadChangeEvent);
        var thread = this._block.thread;
        this._threadChangeEvent = this._thread.changeEvent.attach(this, function() {
            thread.changeEvent.notify();
        });
    };

    p.destroy = function() {};

    p._inspectThread = function() {
        if (!this.dummyBlock.next) {
            switch (this.acceptType) {
                case "basic_param":
                    //this._valueBlock = getBlock(this, {type: "function_field_label"});
                    break;
            }
            if (this._valueBlock)
                this.dummyBlock.insertAfter([this._valueBlock]);
        }

        function getBlock(field, data) {
            var thread = field._block.getThread();
            var board = field._blockView.getBoard();

            var block = new Entry.Block(data, thread);
            var workspace = board.workspace;
            var mode;
            if (workspace)
                mode = workspace.getMode();

            block.createView(board, mode);
            return block;
        }
    };

})(Entry.FieldOutput.prototype);