import { Question } from '../types';

export interface SampleMockPaper {
  id: string;
  title: string;
  category: string;
  durationMinutes: number;
  questionRawText: string;
  answerKeyRawText: string;
  description: string;
  questions: Question[];
}

export const SAMPLE_PAPERS: SampleMockPaper[] = [
  {
    id: 'sample-cs-gate',
    title: 'Computer Science & Engineering Mini-Mock (GATE/SSC)',
    category: 'Computer Science',
    durationMinutes: 15,
    description: '10 standard MCQs covering Data Structures, Algorithms, OS, Computer Networks, and Databases.',
    questionRawText: `1. Which of the following data structures operates on a Last In First Out (LIFO) principle?
(A) Queue
(B) Stack
(C) Binary Tree
(D) Singly Linked List

2. What is the worst-case time complexity of QuickSort on an array of n elements?
(A) O(n log n)
(B) O(n)
(C) O(n^2)
(D) O(log n)

3. Which operating system scheduling algorithm is preemptive and assigns a fixed time quantum to each process?
(A) First-Come, First-Served (FCFS)
(B) Shortest Job First (SJF)
(C) Round Robin (RR)
(D) Priority Scheduling (Non-preemptive)

4. In relational database management systems, which normal form eliminates transitive dependency of non-prime attributes on candidate keys?
(A) First Normal Form (1NF)
(B) Second Normal Form (2NF)
(C) Third Normal Form (3NF)
(D) Boyce-Codd Normal Form (BCNF)

5. Which OSI model layer is responsible for end-to-end communication, flow control, and error recovery?
(A) Data Link Layer
(B) Network Layer
(C) Transport Layer
(D) Session Layer

6. What is the maximum number of nodes in a binary tree of depth k (where root is at depth 1)?
(A) 2^k - 1
(B) 2^(k-1)
(C) 2^(k+1) - 1
(D) 2^k

7. Which HTTP response status code indicates that the requested resource could not be found on the server?
(A) 200 OK
(B) 301 Moved Permanently
(C) 404 Not Found
(D) 500 Internal Server Error

8. In Git version control, which command creates a new branch and immediately switches to it?
(A) git branch -d <branch_name>
(B) git checkout -b <branch_name>
(C) git merge <branch_name>
(D) git remote add <branch_name>

9. Which mechanism prevents mutual exclusion deadlock by ensuring a process holding resources cannot request more without releasing what it holds?
(A) Mutual Exclusion
(B) Hold and Wait elimination
(C) No Preemption
(D) Circular Wait prevention

10. In object-oriented programming, what principle refers to wrapping data and methods into a single unit and restricting direct access to internal components?
(A) Polymorphism
(B) Inheritance
(C) Encapsulation
(D) Abstraction`,
    answerKeyRawText: `1 - B
2 - C
3 - C
4 - C
5 - C
6 - A
7 - C
8 - B
9 - B
10 - C`,
    questions: [
      {
        id: 'sample-cs-1',
        number: 1,
        question: 'Which of the following data structures operates on a Last In First Out (LIFO) principle?',
        options: {
          A: 'Queue',
          B: 'Stack',
          C: 'Binary Tree',
          D: 'Singly Linked List',
        },
        correctAnswer: 'B',
        marks: 1,
        negativeMarks: 0.25,
        explanation: 'A Stack follows the Last In First Out (LIFO) policy, whereas a Queue follows First In First Out (FIFO).',
      },
      {
        id: 'sample-cs-2',
        number: 2,
        question: 'What is the worst-case time complexity of QuickSort on an array of n elements?',
        options: {
          A: 'O(n log n)',
          B: 'O(n)',
          C: 'O(n^2)',
          D: 'O(log n)',
        },
        correctAnswer: 'C',
        marks: 1,
        negativeMarks: 0.25,
        explanation: 'QuickSort exhibits O(n^2) worst-case time complexity when the chosen pivot is consistently the smallest or largest element.',
      },
      {
        id: 'sample-cs-3',
        number: 3,
        question: 'Which operating system scheduling algorithm is preemptive and assigns a fixed time quantum to each process?',
        options: {
          A: 'First-Come, First-Served (FCFS)',
          B: 'Shortest Job First (SJF)',
          C: 'Round Robin (RR)',
          D: 'Priority Scheduling (Non-preemptive)',
        },
        correctAnswer: 'C',
        marks: 1,
        negativeMarks: 0.25,
        explanation: 'Round Robin is designed specifically for time-sharing systems, giving each process a quantum/slice.',
      },
      {
        id: 'sample-cs-4',
        number: 4,
        question: 'In relational database management systems, which normal form eliminates transitive dependency of non-prime attributes on candidate keys?',
        options: {
          A: 'First Normal Form (1NF)',
          B: 'Second Normal Form (2NF)',
          C: 'Third Normal Form (3NF)',
          D: 'Boyce-Codd Normal Form (BCNF)',
        },
        correctAnswer: 'C',
        marks: 1,
        negativeMarks: 0.25,
        explanation: '3NF requires 2NF and that no non-prime attribute is transitively dependent on any candidate key (X -> Y requires X is superkey or Y is prime).',
      },
      {
        id: 'sample-cs-5',
        number: 5,
        question: 'Which OSI model layer is responsible for end-to-end communication, flow control, and error recovery?',
        options: {
          A: 'Data Link Layer',
          B: 'Network Layer',
          C: 'Transport Layer',
          D: 'Session Layer',
        },
        correctAnswer: 'C',
        marks: 1,
        negativeMarks: 0.25,
        explanation: 'The Transport Layer (Layer 4, e.g. TCP/UDP) provides reliable host-to-host end-to-end transport and flow control.',
      },
      {
        id: 'sample-cs-6',
        number: 6,
        question: 'What is the maximum number of nodes in a binary tree of depth k (where root is at depth 1)?',
        options: {
          A: '2^k - 1',
          B: '2^(k-1)',
          C: '2^(k+1) - 1',
          D: '2^k',
        },
        correctAnswer: 'A',
        marks: 1,
        negativeMarks: 0.25,
        explanation: 'Sum of geometric progression 1 + 2 + 4 + ... + 2^(k-1) equals 2^k - 1.',
      },
      {
        id: 'sample-cs-7',
        number: 7,
        question: 'Which HTTP response status code indicates that the requested resource could not be found on the server?',
        options: {
          A: '200 OK',
          B: '301 Moved Permanently',
          C: '404 Not Found',
          D: '500 Internal Server Error',
        },
        correctAnswer: 'C',
        marks: 1,
        negativeMarks: 0.25,
        explanation: 'HTTP 404 is the standard status code indicating client error: resource not found.',
      },
      {
        id: 'sample-cs-8',
        number: 8,
        question: 'In Git version control, which command creates a new branch and immediately switches to it?',
        options: {
          A: 'git branch -d <branch_name>',
          B: 'git checkout -b <branch_name>',
          C: 'git merge <branch_name>',
          D: 'git remote add <branch_name>',
        },
        correctAnswer: 'B',
        marks: 1,
        negativeMarks: 0.25,
        explanation: '`git checkout -b <branch_name>` or `git switch -c <branch_name>` creates and checks out the new branch in one command.',
      },
      {
        id: 'sample-cs-9',
        number: 9,
        question: 'Which mechanism prevents mutual exclusion deadlock by ensuring a process holding resources cannot request more without releasing what it holds?',
        options: {
          A: 'Mutual Exclusion',
          B: 'Hold and Wait elimination',
          C: 'No Preemption',
          D: 'Circular Wait prevention',
        },
        correctAnswer: 'B',
        marks: 1,
        negativeMarks: 0.25,
        explanation: 'Hold and Wait requires a process to request all its resources at once or release current resources before requesting additional ones.',
      },
      {
        id: 'sample-cs-10',
        number: 10,
        question: 'In object-oriented programming, what principle refers to wrapping data and methods into a single unit and restricting direct access to internal components?',
        options: {
          A: 'Polymorphism',
          B: 'Inheritance',
          C: 'Encapsulation',
          D: 'Abstraction',
        },
        correctAnswer: 'C',
        marks: 1,
        negativeMarks: 0.25,
        explanation: 'Encapsulation packages fields and methods together while hiding the internal state from unauthorized external manipulation.',
      },
    ],
  },
  {
    id: 'sample-general-studies',
    title: 'General Studies & Current Awareness Speed Mock',
    category: 'General Knowledge',
    durationMinutes: 10,
    description: '8 high-yield questions on Indian Polity, Geography, Environment, and General Science.',
    questionRawText: `1. Under which Article of the Indian Constitution is the Right to Equality guaranteed?
(A) Articles 14 to 18
(B) Articles 19 to 22
(C) Articles 25 to 28
(D) Articles 32 to 35

2. Which river is known as the "Sorrow of Bengal" due to its historical devastating floods?
(A) Brahmaputra
(B) Damodar
(C) Mahanadi
(D) Kosi

3. What gas makes up approximately 78% of the Earth's atmosphere by volume?
(A) Oxygen
(B) Carbon Dioxide
(C) Nitrogen
(D) Argon

4. Which celestial body is officially classified as a dwarf planet by the International Astronomical Union (IAU) since 2006?
(A) Mercury
(B) Pluto
(C) Titan
(D) Europa

5. The fundamental concept of "Separation of Powers" in constitutional law was prominently formulated by which political philosopher?
(A) John Locke
(B) Montesquieu
(C) Jean-Jacques Rousseau
(D) Thomas Hobbes

6. Which vitamin is synthesized in the human skin upon exposure to ultraviolet B (UVB) rays from sunlight?
(A) Vitamin A
(B) Vitamin C
(C) Vitamin D
(D) Vitamin K

7. What is the SI unit of electric resistance?
(A) Volt
(B) Ohm
(C) Ampere
(D) Watt

8. Which wetland lake in India is recognized as a Ramsar site and is the largest freshwater lake in Northeast India?
(A) Loktak Lake
(B) Chilika Lake
(C) Wular Lake
(D) Vembanad Lake`,
    answerKeyRawText: `Q1: A
Q2: B
Q3: C
Q4: B
Q5: B
Q6: C
Q7: B
Q8: A`,
    questions: [
      {
        id: 'sample-gs-1',
        number: 1,
        question: 'Under which Article of the Indian Constitution is the Right to Equality guaranteed?',
        options: {
          A: 'Articles 14 to 18',
          B: 'Articles 19 to 22',
          C: 'Articles 25 to 28',
          D: 'Articles 32 to 35',
        },
        correctAnswer: 'A',
        marks: 1,
        negativeMarks: 0.25,
      },
      {
        id: 'sample-gs-2',
        number: 2,
        question: 'Which river is known as the "Sorrow of Bengal" due to its historical devastating floods?',
        options: {
          A: 'Brahmaputra',
          B: 'Damodar',
          C: 'Mahanadi',
          D: 'Kosi',
        },
        correctAnswer: 'B',
        marks: 1,
        negativeMarks: 0.25,
      },
      {
        id: 'sample-gs-3',
        number: 3,
        question: 'What gas makes up approximately 78% of the Earth\'s atmosphere by volume?',
        options: {
          A: 'Oxygen',
          B: 'Carbon Dioxide',
          C: 'Nitrogen',
          D: 'Argon',
        },
        correctAnswer: 'C',
        marks: 1,
        negativeMarks: 0.25,
      },
      {
        id: 'sample-gs-4',
        number: 4,
        question: 'Which celestial body is officially classified as a dwarf planet by the International Astronomical Union (IAU) since 2006?',
        options: {
          A: 'Mercury',
          B: 'Pluto',
          C: 'Titan',
          D: 'Europa',
        },
        correctAnswer: 'B',
        marks: 1,
        negativeMarks: 0.25,
      },
      {
        id: 'sample-gs-5',
        number: 5,
        question: 'The fundamental concept of "Separation of Powers" in constitutional law was prominently formulated by which political philosopher?',
        options: {
          A: 'John Locke',
          B: 'Montesquieu',
          C: 'Jean-Jacques Rousseau',
          D: 'Thomas Hobbes',
        },
        correctAnswer: 'B',
        marks: 1,
        negativeMarks: 0.25,
      },
      {
        id: 'sample-gs-6',
        number: 6,
        question: 'Which vitamin is synthesized in the human skin upon exposure to ultraviolet B (UVB) rays from sunlight?',
        options: {
          A: 'Vitamin A',
          B: 'Vitamin C',
          C: 'Vitamin D',
          D: 'Vitamin K',
        },
        correctAnswer: 'C',
        marks: 1,
        negativeMarks: 0.25,
      },
      {
        id: 'sample-gs-7',
        number: 7,
        question: 'What is the SI unit of electric resistance?',
        options: {
          A: 'Volt',
          B: 'Ohm',
          C: 'Ampere',
          D: 'Watt',
        },
        correctAnswer: 'B',
        marks: 1,
        negativeMarks: 0.25,
      },
      {
        id: 'sample-gs-8',
        number: 8,
        question: 'Which wetland lake in India is recognized as a Ramsar site and is the largest freshwater lake in Northeast India?',
        options: {
          A: 'Loktak Lake',
          B: 'Chilika Lake',
          C: 'Wular Lake',
          D: 'Vembanad Lake',
        },
        correctAnswer: 'A',
        marks: 1,
        negativeMarks: 0.25,
      },
    ],
  },
];

