import Phaser from 'phaser';

type BubbleOptions = {
  width?: number;
  padding?: number;
  maxLines?: number;
  fontSize?: number;
  lineSpacing?: number;
  typeSpeedMs?: number; // per character
};

export class SpeechBubble extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Graphics;
  private textObj: Phaser.GameObjects.Text;
  private typingTimer?: Phaser.Time.TimerEvent;
  private currentFullText = "";
  private currentIndex = 0;

  private opts: Required<BubbleOptions> = {
    width: 280,
    padding: 12,
    maxLines: 5,
    fontSize: 16,
    lineSpacing: 6,
    typeSpeedMs: 16,
  };

  constructor(scene: Phaser.Scene, x: number, y: number, opts?: BubbleOptions) {
    super(scene, x, y);
    this.opts = { ...this.opts, ...(opts ?? {}) };

    this.bg = scene.add.graphics();
    this.add(this.bg);

    this.textObj = scene.add.text(0, 0, "", {
      fontFamily: "Arial, sans-serif",
      fontSize: `${this.opts.fontSize}px`,
      color: "#111111",
      wordWrap: { width: this.opts.width - this.opts.padding * 2 },
      lineSpacing: this.opts.lineSpacing,
    });
    this.textObj.setPosition(this.opts.padding, this.opts.padding);
    this.add(this.textObj);

    this.drawBubble(0, 0, this.opts.width, this.bubbleHeightFor(""));
    this.setSize(this.opts.width, this.bubbleHeightFor(""));
    this.setDepth(1000);
    // register this container with the scene so it is part of display list & update list
    scene.add.existing(this);
  }

  private bubbleHeightFor(text: string) {
    this.textObj.setText(text || " ");
    const metrics = this.textObj.getBounds();
    const contentHeight = Math.max(metrics.height, this.opts.fontSize + 2);
    return contentHeight + this.opts.padding * 2 + 10; // + tail area
  }

  private drawBubble(x: number, y: number, w: number, h: number) {
    const radius = 12;
    const tailWidth = 16;
    const tailHeight = 10;

    this.bg.clear();
    this.bg.fillStyle(0xffffff, 1);
    this.bg.lineStyle(2, 0x111111, 1);

    // Rounded rect
    this.bg.fillRoundedRect(x, y, w, h - tailHeight, radius);
    this.bg.strokeRoundedRect(x, y, w, h - tailHeight, radius);

    // Tail (downwards)
    const tailX = w * 0.2;
    const tailY = h - tailHeight;
    this.bg.beginPath();
    this.bg.moveTo(x + tailX, y + tailY);
    this.bg.lineTo(x + tailX + tailWidth / 2, y + h);
    this.bg.lineTo(x + tailX + tailWidth, y + tailY);
    this.bg.closePath();
    this.bg.fillPath();
    this.bg.strokePath();
  }

  clear() {
    this.stopTyping();
    this.currentFullText = "";
    this.currentIndex = 0;
    this.textObj.setText("");
    const h = this.bubbleHeightFor("");
    this.drawBubble(0, 0, this.opts.width, h);
    this.setSize(this.opts.width, h);
  }

  // Instantly set full text (no typing)
  setTextImmediate(text: string) {
    this.stopTyping();
    this.currentFullText = text;
    this.currentIndex = text.length;
    this.textObj.setText(text);
    const h = this.bubbleHeightFor(text);
    this.drawBubble(0, 0, this.opts.width, h);
    this.setSize(this.opts.width, h);
  }

  // Typewriter effect with word wrap
  typeText(fullText: string, onDone?: () => void) {
    this.stopTyping();
    this.currentFullText = fullText;
    this.currentIndex = 0;

    const tick = () => {
      this.currentIndex = Math.min(this.currentIndex + 1, this.currentFullText.length);
      const partial = this.currentFullText.slice(0, this.currentIndex);
      this.textObj.setText(partial);
      const h = this.bubbleHeightFor(partial);
      this.drawBubble(0, 0, this.opts.width, h);
      this.setSize(this.opts.width, h);

      if (this.currentIndex >= this.currentFullText.length) {
        this.stopTyping();
        onDone?.();
      }
    };

    this.typingTimer = this.scene.time.addEvent({
      delay: this.opts.typeSpeedMs,
      loop: true,
      callback: tick,
    });
  }

  stopTyping() {
    this.typingTimer?.remove(false);
    this.typingTimer = undefined;
  }
}
