!(function(d3) {
  var constant = function(d)
  {
    return function constant()
    {
      return d;
    }
  }

  var chord_diagram = function() {
    var _width = function() {return this.clientWidth;};
    var _height = function() {return this.clientHeight;};
    var _margin = constant(40);
    var _outerRadius = function() {
      return Math.min(
        _width.apply(this, arguments),
        _height.apply(this, arguments)
      ) * 0.5 - _margin.apply(this, arguments);
    };
    var _innerRadius = function() {
      return _outerRadius.apply(this, arguments) - 30;
    };
    var _data = function() {return d3.select(this).datum();};
    var _color = constant(d3.scaleOrdinal(d3.schemeCategory20));
    function _cd(selection) {
      var that = selection.node();
      var graph = _data.apply(that, arguments);
      var nodes = graph.nodes;
      var links = graph.links;
      var matrix = nodes.map(function(n) {
        return nodes.map(function(nn) {return 0;});
      });
      var color = _color.apply(that, arguments);

      var nodeIdxMap = {};
      nodes.forEach(function(d, i) {
        nodeIdxMap[d.id] = i;
      });
      links.forEach(function(l) {
        matrix[nodeIdxMap[l.source]][nodeIdxMap[l.target]] = l.value;
        matrix[nodeIdxMap[l.target]][nodeIdxMap[l.source]] = l.value;
      });

      var width = _width.apply(that, arguments);
      var height = _height.apply(that, arguments);
      var outerRadius = _outerRadius.apply(that, arguments);
      var innerRadius = _innerRadius.apply(that, arguments);
      var arcWidth = outerRadius - innerRadius;

      var chord = d3.chord().padAngle(0.01);

      var arc = d3.arc()
          .innerRadius(innerRadius)
          .outerRadius(outerRadius);

      var ribbon = d3.ribbon()
          .radius(innerRadius);

      var chordData = chord(matrix);
      chordData.forEach(function(d) {
        d.source.node = nodes[d.source.index];
        d.target.node = nodes[d.target.index];
      });
      chordData.groups.forEach(function(d) {
        d.node = nodes[d.index];
      });
      selection.append('circle')
        .attr('cx', width / 2)
        .attr('cy', height / 2)
        .attr('r', outerRadius)
        .attr('fill', 'rgba(0, 0, 0, 0.0)')
        .attr('stroke', '#000')
        .on('mouseover', function() {
          d3.event.stopPropagation();
        });
      selection.on('mouseover', function() {
        ribbons.transition().style('opacity', 1.0);
      });
      var g = selection.append('g')
          .attr('transform', 'translate(' + (width / 2) + ',' + (height / 2) + ')')
          .datum(chordData);

      var group = g.append('g')
          .attr('class', 'groups')
        .selectAll('g')
        .data(function(chords) { return chords.groups; })
        .enter().append('g')
        .on('mouseover', mouseover);

      var groupPath = group.append('path')
          .attr('id', function(d, i) { return 'path' + i; })
          .style('fill', function(d) { return color(d.node.group); })
          .style('stroke', function(d) { return d3.rgb(color(d.node.group)).darker(); })
          .attr('d', arc);

      var groupText = group.append("text")
          .attr('x', 0)
          .attr('dy', arcWidth)
          .style('font-size', 10);

      groupText.append("textPath")
        .attr("xlink:href", function(d, i) { return "#path" + i; })
        .text(function(d) { return d.node.id; });

      groupText.filter(function(d, i) {return (groupPath.nodes()[i].getTotalLength() / 2) - arcWidth < this.getComputedTextLength(); })
        .remove();

      var ribbons = g.append('g')
          .attr('class', 'ribbons')
        .selectAll('path')
        .data(function(chords) {return chords; })
        .enter().append('path')
          .attr('d', ribbon)
          .style('fill', function(d) { return color(d.target.node.group); })
          .style('stroke', function(d) { return d3.rgb(color(d.target.node.group)).darker(); })
          .on('mouseover', function() {
            d3.event.stopPropagation();
          });

      function mouseover(d, i) {
        d3.event.stopPropagation();
        ribbons.transition()
          .style('opacity', function(d) {
            return (d.source.index === i || d.target.index === i)?1.0:0.1;
        });
      }
    };
    _cd.width = function(_) {
      return arguments.length ? (_width = typeof _ === 'function' ? _ : constant(+_), _cd) : _width;
    };
    _cd.height = function(_) {
      return arguments.length ? (_height = typeof _ === 'function' ? _ : constant(+_), _cd) : _height;
    };
    return _cd;
  };

  d3.cd = chord_diagram;
}(d3));
