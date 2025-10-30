import { FaTrophy } from 'react-icons/fa';

interface BasicProgressProps {
  level: string;
  lessonsCompleted: number;
  achievements: number;
  streak: number;
}

const BasicProgress = ({ level, lessonsCompleted, achievements, streak }: BasicProgressProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-800">Tu nivel:</span>
        <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full font-semibold">
          {level}
        </span>
      </div>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <span className="font-medium text-gray-800">Lecciones completadas</span>
            <span className="text-gray-700 font-medium">{lessonsCompleted}/10</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-green-500 h-2.5 rounded-full" 
              style={{ width: `${(lessonsCompleted/10)*100}%` }}
            ></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between mb-1">
            <span className="font-medium text-gray-800">Días seguidos practicando</span>
            <span className="text-gray-700 font-medium">{streak}</span>
          </div>
          <div className="flex space-x-1">
            {[...Array(7)].map((_, i) => (
              <div 
                key={i} 
                className={`h-2 rounded-full ${i < streak ? 'bg-yellow-500' : 'bg-gray-200'} flex-1`}
              ></div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-2 text-gray-800">
          <FaTrophy className="text-yellow-500" />
          <span>Logros obtenidos: <strong className="text-indigo-600">{achievements}</strong></span>
        </div>
      </div>
    </div>
  );
};

export default BasicProgress;