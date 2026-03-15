// lib/services/examService.ts
export const getExamPayloadForClient = async (examId: string, studentId: string) => {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      sections: {
        include: {
          // Select strictly what is needed. NO CORRECT ANSWERS!
          questions: {
            select: {
              id: true,
              type: true,
              text: true,
              imageUrl: true,
              options: true,
              matrixLeft: true,
              matrixRight: true,
              // Notice: correctAnswer and explanation are missing here! 🚀
            }
          }
        }
      }
    }
  });

  // Calculate strict server-side deadline
  const forceSubmitAt = new Date(Date.now() + exam.duration * 60000);
  
  // Register Attempt securely
  await prisma.examAttempt.create({
    data: { examId, studentId, forceSubmitAt }
  });

  return exam; // Fully secure payload. Hackers can't find answers in Network Tab.
};