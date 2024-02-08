import { getCampaignData } from '@/utils/useDatabase';
import Cors from 'cors';

// Initializing the cors middleware
const cors = Cors({
  methods: ['HEAD', 'POST']
});

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result)
      }

      return resolve(result)
    })
  })
}

const embedData = async (req, res) => {

  // Run the middleware
  await runMiddleware(req, res, cors);

  const body = req.body;

  try {

    const embedData = await getCampaignData(body?.company_id);
    
    return res.json({ embed_data: embedData });

  } catch (error) {
    
    console.log(error);

    return res.status(500).json({ error: { statusCode: 500, error: true } });

  }
  
};

export default embedData;