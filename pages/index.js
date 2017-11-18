import Canvas from "../components/Canvas";

export default class extends React.Component {
  render() {
    return (
      <div>
        <Canvas />
        <style jsx>{`
          div {
            margin: 8px;
          }
        `}</style>
      </div>
    );
  }
}