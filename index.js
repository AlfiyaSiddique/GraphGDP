function handleSubmit(e) {
  e.preventDefault();
  const value = e.srcElement.country.value;
  document.getElementById("graph").innerHTML = "";
  value === ""
    ? alert("Enter Valid Country Name")
    : getData(value.toUpperCase());

}

function getData(country) {
  d3
  .select("#graph")
  .append("h2")
  .attr("id", "graphTitle")
  .text(`${country} GDP`)

  fetch("/codes.json")
    .then((res) => {
      return res.json();
    })
    .then((data) => {
      const index = Object.values(data).findIndex(
        (e) => e.toUpperCase() === country
      );
      index == -1
        ? alert("No such country found")
        : getGDP(Object.keys(data)[index]);
    })
    .catch((e) => {
      alert("Some Error Occured");
      console.log(e);
    });
}

function getGDP(code) {
  fetch(
    `https://api.worldbank.org/v2/country/${code}/indicator/NY.GDP.MKTP.CD?format=json&per_page=100`
  )
    .then((res) => res.json())
    .then((data) => {
      let dataset = Object.entries(data[1])
        .map((arr) => arr[1])
        .map((obj) => {
          return { date: obj.date, value: obj.value };
        });
      const oneBillion = 1000000000;

      dataset = dataset.map(
        (d) =>
          (d = {
            date: `${d.date}-01-01`,
            value: parseFloat((d.value / oneBillion).toFixed(3)),
          })
      );

      dataset = dataset.filter((d)=>d.value != 0);
      console.log(dataset);

      buildGraph(dataset.reverse());
    });
}

function buildGraph(dataset) {
  const width = 1100;
  const height = 516;
  const padding = 40;

  const svg = d3
    .select("#graph")
    .append("svg")
    .attr("height", height)
    .attr("width", width);

  const heightScale = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(dataset, (data) => {
        return data.value;
      }),
    ])
    .range([0, height - 2 * padding]);

  const xScale = d3
    .scaleLinear()
    .domain([0, dataset.length - 1])
    .range([padding, width - padding]);

  const mindate = new Date(dataset[0].date);
  const maxdate = new Date(dataset[dataset.length - 1].date);

  const xAxisScale = d3
    .scaleTime()
    .domain([mindate, maxdate])
    .range([padding, width - padding]);

  const xAxis = d3.axisBottom(xAxisScale);

  svg
    .append("g")
    .call(xAxis)
    .attr("id", "x-axis")
    .attr("transform", "translate(0, " + (height - padding) + ")");

  const yAxisScale = d3
    .scaleLinear()
    .domain([0, d3.max(dataset, (d) => d.value)])
    .range([height - padding, padding]);

  const yAxis = d3.axisLeft(yAxisScale);

  svg
    .append("g")
    .call(yAxis)
    .attr("id", "y-axis")
    .attr("transform", `translate(${padding},${0})`);

  const tooltip = d3
    .select("body")
    .append("div")
    .attr("id", "tooltip")
    .style("visibility", "hidden")
    .style("width", "auto")
    .style("height", "auto")
    .style("position", "absolute")
    .style("padding", "4px")
    .style("background", "#fff")
    .style("border", "1px solid #000")
    .style("color", "#000")

  svg
    .selectAll("rect")
    .data(dataset)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("data-date", (d) => d.date)
    .attr("width", width / dataset.length)
    .attr("data-gdp", (d) => d.value)
    .attr("height", (d) => heightScale(d.value))
    .attr("x", (d, i) => xScale(i))
    .attr("y", (d) => height - padding - heightScale(d.value))
    .style("fill", "#7bc5e6")
    .on("mouseover", (e, data)=>{
       tooltip
       .style("visibility", "visible")
       .style('opacity', .8)
       .style("top", `${e.pageY+15}px`)
       .style("left", `${e.pageX+10}px`)

       
       tooltip.html('<p> Date: ' + data.date + '</p>'
       + '<p> Billions: ' + data.value + '</p>');
       
   
      e.target.style.opacity = .3;
      e.target.style.cursor = "pointer";
       document.querySelector("#tooltip").setAttribute("data-date", data.date);
    
    }).on("mouseout", (e)=>{
      tooltip
      .style("visibility", "hidden");
      e.target.style.opacity = 1;
    })
}

fetch("/defaultData.json")
  .then((res) => {
    return res.json();
  })
  .then((response) => {
    const dataset = response.data.map((d) => {
      return { date: d[0], value: d[1] };
    });
    buildGraph(dataset);
  })
  .catch((e) => {
    alert("Some Error Occured while fetching data");
    console.log(e);
  });
