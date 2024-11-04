import 'dotenv/config'
import sonarqube from 'sonarqube-scanner';

const serverUrl = process.env.SONARQUBE_URL;
const token = process.env.SONARQUBE_TOKEN;
const options = {
  'sonar.projectName': 'Chat App Backend',
  'sonar.projectDescription': 'The backend for the chat app',
  'sonar.sources': 'src',
  'sonar.tests': 'test',
};

sonarqube.scan({ serverUrl, token, options, }, error => {
  if (error) {
    console.error(error);
  }

  process.exit();
});
