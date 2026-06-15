const referralTree = [
  {
    "user_id": "99fee795-4335-47e9-bf86-b16bec3f4aca",
    "full_name": "nayan",
    "referred_by": "32110317-3072-4d8b-9bc2-125598750237",
    "level": 1,
    "joined_at": "2026-06-07T07:25:16.535426+00:00"
  },
  {
    "user_id": "a7bc0ae3-bd7b-483c-a1ea-dc0947b65e9f",
    "full_name": "Devotee Sunita",
    "referred_by": "32110317-3072-4d8b-9bc2-125598750237",
    "level": 1,
    "joined_at": "2026-06-06T15:22:37.450116+00:00"
  },
  {
    "user_id": "096c5fa7-1373-433f-ada3-c331e63bc256",
    "full_name": "Devotee Ramesh",
    "referred_by": "32110317-3072-4d8b-9bc2-125598750237",
    "level": 1,
    "joined_at": "2026-06-06T15:22:36.449895+00:00"
  },
  {
    "user_id": "3b4a182e-b94b-4efe-923c-6d5d4c66cf60",
    "full_name": "affilation",
    "referred_by": "32110317-3072-4d8b-9bc2-125598750237",
    "level": 1,
    "joined_at": "2026-06-06T15:08:11.998671+00:00"
  },
  {
    "user_id": "05d5504c-2507-4b18-9e56-c41829d2b346",
    "full_name": "purab",
    "referred_by": "99fee795-4335-47e9-bf86-b16bec3f4aca",
    "level": 2,
    "joined_at": "2026-06-07T07:35:19.742931+00:00"
  }
];

const rootId = "32110317-3072-4d8b-9bc2-125598750237";

const buildTree = (nodes, rootId) => {
  const map = new Map();
  nodes.forEach(n => {
    map.set(n.user_id, { ...n, children: [] });
  });
  const rootNodes = [];
  nodes.forEach(n => {
    const node = map.get(n.user_id);
    if (!n.referred_by || n.referred_by === rootId) {
      rootNodes.push(node);
    } else {
      const parent = map.get(n.referred_by);
      if (parent) {
        parent.children.push(node);
      } else {
        rootNodes.push(node);
      }
    }
  });
  return rootNodes;
};

const tree = buildTree(referralTree, rootId);
console.log('Resulting Tree Structure:');
console.log(JSON.stringify(tree, null, 2));
