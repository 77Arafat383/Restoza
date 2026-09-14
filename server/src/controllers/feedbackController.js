const prisma = require('../prisma');

const submitFeedback = async (req, res) => {
  try {
    const { customerName, foodRating, serviceRating, overallRating, comment, orderId } = req.body;

    const feedback = await prisma.feedback.create({
      data: {
        customerName: customerName || 'Valued Guest',
        foodRating: foodRating ? parseInt(foodRating) : 5,
        serviceRating: serviceRating ? parseInt(serviceRating) : 5,
        overallRating: overallRating ? parseInt(overallRating) : 5,
        comment: comment || null,
        orderId: orderId ? parseInt(orderId) : null,
      },
    });

    return res.status(201).json({
      message: 'Thank you for your feedback!',
      feedback,
    });
  } catch (error) {
    console.error('submitFeedback error:', error);
    return res.status(500).json({ message: 'Failed to submit feedback.' });
  }
};

const getFeedbacks = async (req, res) => {
  try {
    const feedbacks = await prisma.feedback.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const total = feedbacks.length;
    const avgRating = total > 0 
      ? (feedbacks.reduce((acc, f) => acc + f.overallRating, 0) / total).toFixed(1)
      : 5.0;

    return res.json({
      feedbacks,
      stats: {
        total,
        averageRating: parseFloat(avgRating),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch feedback.' });
  }
};

module.exports = {
  submitFeedback,
  getFeedbacks,
};
