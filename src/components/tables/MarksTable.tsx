import React from 'react';

interface Mark {
  id: string;
  subjectName: string;
  subjectCode: string;
  examType: string;
  marksObtained: number;
  maxMarks: number;
  percentage: string;
  grade: string;
}

interface MarksTableProps {
  marks: Mark[];
  onRowClick?: (mark: Mark) => void;
}

const MarksTable: React.FC<MarksTableProps> = ({ marks, onRowClick }) => {
  const getGradeColor = (grade: string) => {
    if (grade === 'A' || grade === 'A+') return 'bg-green-100 text-green-800';
    if (grade === 'B' || grade === 'B+') return 'bg-blue-100 text-blue-800';
    if (grade === 'C' || grade === 'C+') return 'bg-yellow-100 text-yellow-800';
    if (grade === 'D') return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 border-b">
          <tr>
            <th className="px-4 py-2 text-left">Subject</th>
            <th className="px-4 py-2 text-left">Exam Type</th>
            <th className="px-4 py-2 text-right">Marks</th>
            <th className="px-4 py-2 text-center">Percentage</th>
            <th className="px-4 py-2 text-center">Grade</th>
          </tr>
        </thead>
        <tbody>
          {marks.map((mark) => (
            <tr
              key={mark.id}
              className="border-b hover:bg-gray-50 cursor-pointer"
              onClick={() => onRowClick?.(mark)}
            >
              <td className="px-4 py-3">
                <p className="font-semibold">{mark.subjectName}</p>
                <p className="text-gray-600 text-xs">{mark.subjectCode}</p>
              </td>
              <td className="px-4 py-3">{mark.examType}</td>
              <td className="px-4 py-3 text-right">
                {mark.marksObtained}/{mark.maxMarks}
              </td>
              <td className="px-4 py-3 text-center">{mark.percentage}%</td>
              <td className="px-4 py-3 text-center">
                <span className={`px-3 py-1 rounded font-bold ${getGradeColor(mark.grade)}`}>
                  {mark.grade}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MarksTable;