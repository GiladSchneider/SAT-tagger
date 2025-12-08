export interface Question {
  id: string;
  subject: string;
  question_image: string | null;
  answer_image: string | null;
  correct_answer: string | null;
  difficulty: string | null;
  tags: string[];
}
