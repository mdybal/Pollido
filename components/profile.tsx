// // filepath: /home/mdybal/Desktop/Programming/Pollido/components/Modal.tsx
// import React from 'react';

// interface Profile {
//   isOpen: boolean;
//   onClose: () => void;
// }

// const Modal: React.FC<Profile> = ({ isOpen, onClose, children }) => {
//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
//       <div className="bg-white p-4 rounded">
//         <button onClick={onClose} className="absolute top-2 right-2">Close</button>
//         {children}
//       </div>
//     </div>
//   );
// };

// export default Modal;