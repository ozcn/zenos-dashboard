!((function(d3) {
  var constant = function(d)
  {
    return function constant()
    {
      return d;
    }
  }

  var fdg = function() {
    var _width = function() {return this.clientWidth;};
    var _height = function() {return this.clientHeight;};
    var _graph = function() {return d3.select(this).datum();};
    var _id = constant(function(d) {return d.id;});
    var _color = constant(d3.scaleOrdinal(d3.schemeCategory20));
    function _fdg(selection) {
      var that = selection.node();
      var width = _width.apply(that, arguments);
      var height = _height.apply(that, arguments);
      var color = _color.apply(that, arguments);
      var simulation = d3.forceSimulation()
        .force('link', d3.forceLink().id(_id.apply(that, arguments)))
        .force('charge', d3.forceManyBody())
        .force('center', d3.forceCenter(width / 2, height / 2));

      var graph = _graph.apply(that, arguments);

      var link = selection.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(graph.links)
        .enter().append('line')
          .style('stroke', '#999')
          .style('stroke-opacity', 0.6)
          .attr('stroke-width', function(d) {return Math.sqrt(d.value);});

      var node = selection.append('g')
        .attr('class', 'nodes')
        .selectAll('circle')
        .data(graph.nodes)
        .enter().append('circle')
          .style('stroke', '#FFF')
          .style('stroke-width', 1.5)
          .attr('r', 5)
          .attr('fill', function(d) { return color(d.group); })
          .call(d3.drag()
              .on('start', dragstarted)
              .on('drag', dragged)
              .on('end', dragended));

      node.append('title')
          .text(_id.apply(that, arguments));

      function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
      }

      function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }

      function ticked() {
        link
            .attr('x1', function(d) { return d.source.x; })
            .attr('y1', function(d) { return d.source.y; })
            .attr('x2', function(d) { return d.target.x; })
            .attr('y2', function(d) { return d.target.y; });

        node
            .attr('cx', function(d) { return d.x; })
            .attr('cy', function(d) { return d.y; });
      }

      simulation.nodes(graph.nodes).on('tick', ticked);

      simulation.force("link")
          .links(graph.links);

    };
    _fdg.width = function(_) {
      return arguments.length ? (_width = typeof _ === 'function' ? _ : constant(+_), _fdg) : _width;
    };
    _fdg.height = function(_) {
      return arguments.length ? (_height = typeof _ === 'function' ? _ : constant(+_), _fdg) : _height;
    };
    return _fdg;
  };

  d3.fdg = fdg;
})(d3));
