import { useState, useRef, useCallback } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Panel,
  ConnectionMode,
  MarkerType,
  getIncomers,
  getOutgoers,
  getConnectedEdges,
} from 'reactflow';
import 'reactflow/dist/style.css';
import ButtonEdge from '../ButtonEdge/ButtonEdge.jsx';
import './workflow.css';

const initialNodes = [
  {
    id: '1',
    type: 'input',
    data: {
      label: (
        <>
          <input type='text' className='border-none focus:outline-none w-[80%] text-center font-bold' defaultValue="Test" />
        </>
      )
    },
    position: { x: 250, y: 8 },
    style: {
      borderColor: '#0041d0',
    }
  },
];

const edgeTypes = {
  buttonedge: ButtonEdge,
};

const edgeOptions = {
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#4f7ddf',
  },
  style: { stroke: '#4f7ddf' },
  type: 'buttonedge'
}

let id = 0;
const getId = () => `dndnode_${++id}`;
const getPrevId = () => `dndnode_${id - 1}`
const Workflow = () => {

  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge(params, eds))
  },
    //eslint-disable-next-line 
    []);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onNodesDelete = useCallback(
    (deleted) => {
      setEdges(
        deleted.reduce((acc, node) => {
          const incomers = getIncomers(node, nodes, edges);
          const outgoers = getOutgoers(node, nodes, edges);
          const connectedEdges = getConnectedEdges([node], edges);

          const remainingEdges = acc.filter((edge) => !connectedEdges.includes(edge));

          const createdEdges = incomers.flatMap(({ id: source }) =>
            outgoers.map(({ id: target }) => ({ id: `${source}->${target}`, source, target }))
          );

          return [...remainingEdges, ...createdEdges];
        }, edges)
      );
    },
    //eslint-disable-next-line
    [nodes, edges]
  );

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      const newNode = {
        id: getId(),
        type: 'default',
        position,
        data: {
          label: (
            <>
              <input type='text' className='border-none focus:outline-none w-[80%] mx-auto text-center font-bold' defaultValue={type} />
            </>
          )
        },
        targetPosition: 'top',
        style: {
          borderColor: '#0041d0',
        }
      };
      setNodes((nds) => nds.concat(newNode));
      if (getPrevId() === "dndnode_0") {
        const newNodeEdges = {
          ...edgeOptions,
          source: "1",
          target: newNode.id
        }
        setEdges((eds) => addEdge(newNodeEdges, eds))
      } else if (newNode.id !== "dndnode_0") {
        const newNodeEdges = {
          ...edgeOptions,
          source: getPrevId(),
          target: newNode.id
        }
        setEdges((eds) => addEdge(newNodeEdges, eds))
      }
    },
    //eslint-disable-next-line
    [reactFlowInstance]
  );
  const [variant, setVariant] = useState('cross');

  const rawData = [
    {
      id: 1,
      name: "Box 1",
    },
    {
      id: 2,
      name: "Box 2",
    },
    {
      id: 3,
      name: "Box 3"
    }
  ];

  return (
    <>

      <aside style={{ float: "left" }} className='p-0 border-2 border-r-blue-500 flex bg-[#fcfcfc] justify-center grow h-full flex-col'>
        <div className="flex pb-4 border-b-2 w-[100px] md:w-[200px] mb-3 font-semibold h-10 text-lg tracking-tight justify-center"><p className='pt-1'>Modules</p></div>
        <div className='flex flex-col pl-4 font-semibold overflow-auto space-y-10 h-full mt-10'>
          {rawData.map((index) => <div className='dndnode input md:h-[60px] h-[40px] w-10/12  flex justify-center items-center rounded-lg' key={index.id} onDragStart={(event) => onDragStart(event, index.name)} draggable>
            <h1>{index.name}</h1>
          </div>)}
        </div>
      </aside>
      <div className="dndflow min-h-screen m-0">
        <ReactFlowProvider>
          <div className="reactflow-wrapper" ref={reactFlowWrapper} >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              defaultEdgeOptions={edgeOptions}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              snapToGrid={true}
              edgeTypes={edgeTypes}
              attributionPosition="top-right"
              connectionMode={ConnectionMode.Loose}
              onDragOver={onDragOver}
              fitView
              onNodesDelete={onNodesDelete}
            >
              <Background color="#ccc" variant={variant} />
              <Panel>
                <div className='font-semibold flex flex-col md:flex-row space-y-2 space-x-0 md:space-x-3 md:space-y-0 items-center'>
                  <p className='md:text-xl text-base'>Variants : </p>
                  <button onClick={() => setVariant('dots')} className='border-2 border-gray-400 hover:bg-slate-200 px-2 rounded-2xl sm:text-sm md:text-base'>Dots</button>
                  <button onClick={() => setVariant('lines')} className='border-2 border-gray-400 hover:bg-slate-200 px-2 rounded-2xl'>Lines</button>
                  <button onClick={() => setVariant('cross')} className='border-2 border-gray-400 hover:bg-slate-200 px-2 rounded-2xl'>Cross</button></div>
              </Panel>
              <Controls />
            </ReactFlow>
          </div>
        </ReactFlowProvider>
      </div>
    </>
  );
};

export default Workflow;