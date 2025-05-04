"use client";

const SNAPSHOTS = [
  {
    id: "snapshot1",
    isUsed: true,
  },
  {
    id: "snapshot2",
    isUsed: false,
  },
  {
    id: "snapshot3",
    isUsed: false,
  },
];

function SidebarSnapshot({snapshot, id}: {snapshot: {id: string, isUsed: boolean}, id: number}) {
    return (
        <div key={id} className={"sidebar-snapshot"}>
            ID: {snapshot.id}
        </div>
    )
}

export function Sidebar() {
  return (
    <>
      <div className={"sidebar-container"}>
        {SNAPSHOTS.map((snapshot, idx) => {
          return ( <SidebarSnapshot snapshot={snapshot} id={idx} key={idx}/>);
        })}
      </div>
    </>
  );
}
