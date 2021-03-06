var parseDrawing = function(text) {
  text = text.replace(/([mnlbspc])/gi, ' $1 ')
             .replace(/^\s*|\s*$/g, '')
             .replace(/\s+/g, ' ')
             .toLowerCase();
  var rawCommands = text.split(/\s(?=[mnlbspc])/),
      commands = [];
  var s2b = function(ps, prevType, nextType) {
    // D3.js, d3_svg_lineBasisOpen()
    var bb1 = [0, 2/3, 1/3, 0],
        bb2 = [0, 1/3, 2/3, 0],
        bb3 = [0, 1/6, 2/3, 1/6];
    var dot4 = function(a, b) {
      return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
    };
    var px = [ps[ps.length - 1].x, ps[0].x, ps[1].x, ps[2].x],
        py = [ps[ps.length - 1].y, ps[0].y, ps[1].y, ps[2].y];
    var path = ['L', new Point(dot4(bb3, px), dot4(bb3, py))];
    if (prevType === 'M') path[0] = 'M';
    for (var i = 3; i < ps.length; i++) {
      px = [ps[i - 3].x, ps[i - 2].x, ps[i - 1].x, ps[i].x];
      py = [ps[i - 3].y, ps[i - 2].y, ps[i - 1].y, ps[i].y];
      path.push('C' + new Point(dot4(bb1, px), dot4(bb1, py)),
                ',' + new Point(dot4(bb2, px), dot4(bb2, py)),
                ',' + new Point(dot4(bb3, px), dot4(bb3, py)));
    }
    if (nextType === 'L' || nextType === 'C') {
      path.push('L', ps[ps.length - 1]);
    }
    return path.join('');
  };
  function Point(x, y) {
    this.x = x;
    this.y = y;
    this.toString = function() {
      return this.x + ',' + this.y;
    };
  }
  function DrawingCommand(type) {
    this.points = [];
    this.type = null;
    this.prevType = null;
    this.nextType = null;
    if (/m/.test(type)) this.type = 'M';
    if (/n|l/.test(type)) this.type = 'L';
    if (/b/.test(type)) this.type = 'C';
    if (/s/.test(type)) this.type = '_S';
    this.isValid = function() {
      if (!this.points.length || !this.type) return false;
      if (/C|S/.test(this.type) && this.points.length < 3) return false;
      return true;
    };
    this.toString = function() {
      if (this.type === '_S') {
        return s2b(this.points, this.prevType, this.nextType);
      }
      return this.type + this.points.join();
    };
  }

  var i = 0;
  while (i < rawCommands.length) {
    var p = rawCommands[i].split(' '),
        command = new DrawingCommand(p[0]);
    for (var lenj = p.length - !(p.length & 1), j = 1; j < lenj; j += 2) {
      command.points.push(new Point(p[j], p[j + 1]));
    }
    if (/p|c/.test(p[0])) {
      if (commands[i - 1].type === '_S') {
        if (p[0] === 'p') {
          var prev = commands[i - 1].points.concat(command.points);
          commands[i - 1].points = prev;
        }
        if (p[0] === 'c') {
          var ps = commands[i - 1].points;
          commands[i - 1].points.push(new Point(ps[0].x, ps[0].y),
                                      new Point(ps[1].x, ps[1].y),
                                      new Point(ps[2].x, ps[2].y));
        }
      }
      rawCommands.splice(i, 1);
    } else {
      if (p[0] === 's') {
        var prev = commands[i - 1].points[commands[i - 1].points.length - 1];
        command.points.unshift(new Point(prev.x, prev.y));
      }
      if (command.isValid()) {
        if (i) {
          command.prevType = commands[i - 1].type;
          commands[i - 1].nextType = command.type;
        }
        commands.push(command);
      }
      i++;
    }
  }

  return commands;
};
